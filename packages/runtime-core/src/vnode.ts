import {
  isArray,
  isNumber,
  ShapeFlags,
  isString,
  isObject,
  isFn
} from '@vue/shared'

export const Text = Symbol('v-txt')

export function normalizeVNode(child) {
  return isString(child) || isNumber(child)
    ? createVnode(Text, null, String(child))
    : child
}

function normalizeChildren(vnode, children) {
  let { shapeFlag } = vnode

  if (isArray(children)) {
    shapeFlag |= ShapeFlags.ARRAY_CHILDREN
  } else if (isObject(children)) {
    if (shapeFlag & ShapeFlags.COMPONENT) {
      shapeFlag |= ShapeFlags.SLOTS_CHILDREN
    }
  } else if (isFn(children)) {
    if (shapeFlag & ShapeFlags.COMPONENT) {
      shapeFlag |= ShapeFlags.SLOTS_CHILDREN
      children = { default: children }
    }
  } else if (isNumber(children) || isString(children)) {
    children = String(children)
    shapeFlag |= ShapeFlags.TEXT_CHILDREN
  }

  vnode.shapeFlag = shapeFlag
  vnode.children = children
}

export function createVnode(type, props = null, children = null) {
  let shapeFlag = 0
  if (isString(type)) {
    shapeFlag = ShapeFlags.ELEMENT
  } else if (isObject(type)) {
    shapeFlag = ShapeFlags.STATEFUL_COMPONENT
  }

  const vnode = {
    __v_isVNode: true,
    type,
    props,
    children,
    key: props?.key ?? null,
    el: null, //虚拟节点创建出的真实DOM 组件的vnode上的el指向subTree的el
    shapeFlag,
    component: null //如果是个组件vnode，保存组件实例
  }
  normalizeChildren(vnode, children)
  return vnode
}
export function isVNode(value) {
  return !!value?.__v_isVNode
}

export function isSameVnode(n1, n2) {
  return n1.type === n2.type && n1.key === n2.key
}
