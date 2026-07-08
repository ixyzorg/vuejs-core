import { ShapeFlags } from '@vue/shared'

export function initSlots(instance) {
  const { vnode, slots } = instance
  if (vnode.shapeFlag & ShapeFlags.SLOTS_CHILDREN) {
    for (const key in vnode.children) {
      slots[key] = vnode.children[key]
    }
  } 
}
