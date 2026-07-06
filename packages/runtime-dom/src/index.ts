import { isString } from '@vue/shared'
import { nodeOpts } from './nodeOpts'
import { patchProp } from './patchProp'
import { createRenderer } from '@vue/runtime-core'

const renderOptions = { ...nodeOpts, patchProp }
const renderer = createRenderer(renderOptions)

export * from '@vue/runtime-core'
export function render(vnode, container) {
  renderer.render(vnode, container)
}

export function createApp(rootComp, rootProps) {
  const app = renderer.createApp(rootComp, rootProps)
  const { mount } = app

  app.mount = function (container) {
    let el = container
    if (isString(container)) {
      el = document.querySelector(container)
    }
    return mount(el)
  }

  return app
}
