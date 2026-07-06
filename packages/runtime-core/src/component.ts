import { proxyRefs } from '@vue/reactivity'
import { initProps, normalizeProps } from './componentProps'
import { isFn, isObject } from '@vue/shared'
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
    slots: {},
    refs: {},
    subTree: null, //render的返回值
    isMounted: false,
    render: null, //保存render函数
    setupState: null, //setup函数返回值
    ctx: null,
    proxy: null //组件代理对象便于访问setupState，以及props，attrs等
  }
  instance.ctx = { _: instance }
  return instance
}

export function setupComponent(instance) {
  initProps(instance)
  setupStateFulComponent(instance)
}

const publicPropertiesMap = {
  $slots: (instance) => instance.slots,
  $attrs: (instance) => instance.attrs,
  $refs: (instance) => instance.refs,
  $nextTick: (instance) => {}
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
        console.log(p)

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
  const setupResult = type.setup(instance.props, setupContext)
  handleSetupResult(instance, setupResult)
  if (!instance.render) {
    instance.render = type.render
  }
}

function createSetupContext(instance) {
  return {
    get attrs() {
      return instance.attrs
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
