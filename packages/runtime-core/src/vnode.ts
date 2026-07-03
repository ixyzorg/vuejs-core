import { isArray, isNumber, ShapeFlags, isString } from '@vue/shared'

export const Text = Symbol('v-txt')

export function normalizeVNode(child) {
  return isString(child) || isNumber(child)
    ? createVnode(Text, null, String(child))
    : child
}

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
    el: null, //虚拟节点创建出的真实DOM
    shapeFlag
  }
}
export function isVNode(value) {
  return !!value?.__v_isVNode
}

export function isSameVnode(n1, n2) {
  return n1.type === n2.type && n1.key === n2.key
}
