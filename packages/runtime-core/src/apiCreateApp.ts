import { h } from './h'
export function createAppAPI(render) {
  return function createApp(rootComp, rootProps) {
    const app = {
      _container: null,
      mount(container) {
        const vnode = h(rootComp, rootProps)
        render(vnode, container)
        app._container = container
      },
      unmount() {
        render(null, app._container)
      }
    }
    return app
  }
}
