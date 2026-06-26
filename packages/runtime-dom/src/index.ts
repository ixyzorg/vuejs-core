import { nodeOpts } from './nodeOpts'
import { patchProp } from './patchProp'
import { createRenderer } from '@vue/runtime-core'

const renderOptions = { ...nodeOpts, patchProp }
const renderer = createRenderer(renderOptions)

export * from '@vue/runtime-core'
export function render(vnode, container) {
  renderer.render(vnode, container)
}
