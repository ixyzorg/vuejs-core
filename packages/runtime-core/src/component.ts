import { proxyRefs } from '@vue/reactivity'
import { initProps, normalizeProps } from './componentProps'
import { isFn, isObject } from '@vue/shared'
import { nextTick } from './scheduler'
import { initSlots } from './componentSlots'
export function createComponentInstance(vnode) {
  const { type } = vnode
  const instance = {
    type,
    vnode,
    /*  
    组件声明的props
    props:['msg']
    props:{
      msg:String
    }, 
    */
    propsOptions: normalizeProps(type.props),
    props: {},
    attrs: {},
    emit: null,
    slots: {},
    refs: {},
    subTree: null, //render的返回值
    isMounted: false,
    render: null, //保存render函数
    setupState: null, //setup函数返回值
    ctx: null,
    proxy: null, //组件代理对象便于访问setupState，以及props，attrs等
    update: null, //绑定effect中的run函数，更新重新收集依赖
    next: null, //如果父组件传递的props或者children，保存当前组件vnode到next
    exposed: null //绑定用户暴露的exposed
  }
  instance.emit = emit.bind(null, instance)
  instance.ctx = { _: instance }
  return instance
}

export function setupComponent(instance) {
  initProps(instance) //初始化属性
  initSlots(instance) //初始化插槽
  setupStateFulComponent(instance) //初始化状态
}

const publicPropertiesMap = {
  $el: (instance) => instance.vnode.el,
  $slots: (instance) => instance.slots,
  $attrs: (instance) => instance.attrs,
  $emit: (instance) => instance.emit,
  $refs: (instance) => instance.refs,
  $nextTick: (instance) => nextTick.bind(instance),
  $forceUpDate: (instance) => instance.update()
}

function setupStateFulComponent(instance) {
  const { type } = instance
  //创建代理对象用来访问instance实例
  instance.proxy = new Proxy(instance.ctx, {
    get(target, p, receiver) {
      const { _: instance } = target
      const { setupState, props } = instance
      if (Object.hasOwn(setupState, p)) {
        return Reflect.get(setupState, p, receiver)
      }
      if (Object.hasOwn(props, p)) {
        return Reflect.get(props, p, receiver)
      }
      if (Object.hasOwn(publicPropertiesMap, p)) {
        const getter = publicPropertiesMap[p]
        return getter(instance)
      }
    },
    set(target, p, newValue, receiver) {
      const { _: instance } = target
      const { setupState } = instance

      if (Object.hasOwn(setupState, p)) {
        return Reflect.set(setupState, p, newValue, receiver)
      }
      return true
    }
  })
  const setupContext = createSetupContext(instance)
  setCurrentInstance(instance) //设置组件实例 只能在setup里面调用
  const setupResult = type.setup(instance.props, setupContext)
  unsetCurrentInstance() //清除
  handleSetupResult(instance, setupResult)
  if (!instance.render) {
    instance.render = type.render
  }
}

function createSetupContext(instance) {
  return {
    get attrs() {
      return instance.attrs
    },
    get slots() {
      return instance.slots
    },
    emit(event: string, ...args) {
      emit(instance, event, ...args)
    },
    expose(exposed) {
      instance.exposed = exposed
    }
  }
}

function handleSetupResult(instance, setupResult) {
  if (isFn(setupResult)) {
    instance.render = setupResult
  } else if (isObject) {
    instance.setupState = proxyRefs(setupResult)
  }
}

function emit(instance, event, ...args) {
  event = `on${event[0].toUpperCase() + event.slice(1)}`
  const handler = instance.vnode.props?.[event]
  if (isFn(handler)) {
    handler(...args)
  }
}

let currentInstance = null
function setCurrentInstance(instance) {
  currentInstance = instance
}
export function getCurrentInstance() {
  return currentInstance
}

function unsetCurrentInstance() {
  currentInstance = null
}


/**
 * @description 暴露组件公开的属性
 * @param instance 
 * @returns 
 */
export function getComponentPublicInstance(instance) {
  if (instance.exposed) {
    instance.exposedProxy = new Proxy(proxyRefs(instance.exposed), {
      get(target, p, receiver) {
        if (p in target) {
          return target[p]
        }
        if (p in publicPropertiesMap) {
          return publicPropertiesMap[p](instance)
        }
      }
    })
    return instance.exposedProxy
  } else {
    return instance.proxy
  }
}
