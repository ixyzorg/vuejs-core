import { isArray, isObject } from '@vue/shared'
import { createVnode, isVNode } from './vnode'

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
