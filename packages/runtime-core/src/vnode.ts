import { isArray, ShapeFlags, isString } from '@vue/shared'
export function createVnode(type, props = null, children = null) {
  let shapeFlag
  if (isString(type)) {
    shapeFlag = ShapeFlags.ELEMENT
  }

  if (isString(children)) {
    shapeFlag |= ShapeFlags.TEXT_CHILDREN
  } else if (isArray(children)) {
    shapeFlag |= ShapeFlags.ARRAY_CHILDREN
  }

  return {
    __v_isVNode: true,
    type,
    props,
    children,
    key: props?.key ?? null,
    el: null, //虚拟节点要挂载的元素 这个元素_vnode属性上有这个vnode对象
    shapeFlag
  }
}
export function isVNode(value) {
  return !!value?.__v_isVNode
}

export function isSameVnode(n1, n2) {
  return n1.type === n2.type && n1.key === n2.key
}
