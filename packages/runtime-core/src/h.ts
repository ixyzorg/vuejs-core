import { isArray, isObject } from '@vue/shared'

export function h(type, propsOrChildren?, children?, ...extraChildren) {
  let length = arguments.length
  if (length === 2) {
    if (isArray(propsOrChildren)) {
      return createVnode(type, null, propsOrChildren)
    }
    if (isObject(propsOrChildren)) {
      if (isVNode(propsOrChildren)) {
        return createVnode(type, null, [propsOrChildren])
      }
      return createVnode(type, propsOrChildren)
    }
    return createVnode(type, null, propsOrChildren)
  } else {
    if (length > 3) {
      children = [...arguments].slice(2)
    } else if (isVNode(children)) {
      children = [children]
    }
    return createVnode(type, propsOrChildren, children)
  }
}

function createVnode(type, props = null, children = null) {
  return {
    __v_isVNode: true,
    type,
    props,
    children,
    key: null,
    el: null //虚拟节点要挂在的元素
  }
}

function isVNode(value) {
  return !!value?.__v_isVNode
}
