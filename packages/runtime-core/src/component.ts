import { proxyRefs } from '@vue/reactivity'
export function createComponentInstance(vnode) {
  const { type } = vnode
  const instance = {
    type,
    vnode,
    props: {},
    attrs: {},
    subTree: null, //render的返回值
    isMounted: false,
    render: null, //保存render函数
    setupState: null //setup函数返回值
  }
  return instance
}

export function setupComponent(instance) {
  const { type } = instance
  instance.render = type.render
  
  const setupResult = proxyRefs(type.setup())
  instance.setupState = setupResult
}
