import { isRef } from '@vue/reactivity'
import { ShapeFlags } from '@vue/shared'
import { getComponentPublicInstance } from './component'

export function setRef(ref, vnode) {
  const { shapeFlag } = vnode
  if (shapeFlag & ShapeFlags.COMPONENT) {
    ref.value = getComponentPublicInstance(vnode.component)
  } else {
    if (isRef(ref)) {
      ref.value = vnode.el
    }
  }
}
