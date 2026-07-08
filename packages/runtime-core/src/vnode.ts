import { isArray, isNumber, ShapeFlags, isString, isObject } from '@vue/shared'

export const Text = Symbol('v-txt')

export function normalizeVNode(child) {
  return isString(child) || isNumber(child)
    ? createVnode(Text, null, String(child))
    : child
}

function normalizeChildren(child) {
  return isNumber(child) ? String(child) : child
}

export function createVnode(type, props = null, children = null) {
  children = normalizeChildren(children)

  let shapeFlag
  if (isString(type)) {
    shapeFlag = ShapeFlags.ELEMENT
  } else if (isObject(type)) {
    shapeFlag = ShapeFlags.STATEFUL_COMPONENT
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
    el: null, //虚拟节点创建出的真实DOM 组件的vnode上的el指向subTree的el
    shapeFlag,
    component:null, //如果是个组件vnode，保存组件实例
  }
}
export function isVNode(value) {
  return !!value?.__v_isVNode
}

export function isSameVnode(n1, n2) {
  return n1.type === n2.type && n1.key === n2.key
}
