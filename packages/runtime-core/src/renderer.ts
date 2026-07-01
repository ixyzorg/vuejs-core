import { isNull, ShapeFlags } from '@vue/shared'

export function createRenderer(options) {
  const {
    createElement,
    insert,
    setElementText,
    remove,
    createText,
    setText,
    parentNode,
    nextSibling,
    querySelector,
    patchProp
  } = options

  const unmount = (vnode) => {
    const { shapeFlag, type, children } = vnode
    if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      unmountChildren(children)
    }
    remove(vnode.el)
  }
  const unmountChildren = (children) => {
    for (const child of children) {
      unmount(child)
    }
  }

  const mountElement = (vnode, container) => {
    const { type, props, children, shapeFlag } = vnode
    const el = createElement(type)
    vnode.el = el

    if (props) {
      for (const key in props) {
        patchProp(el, key, null, props[key])
      }
    }

    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      setElementText(el, children)
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(children, el)
    }

    insert(el, container)
  }

  const mountChildren = (children, el) => {
    for (const child of children) {
      patch(null, child, el)
    }
  }
  //#region 挂载、更新
  const patch = (n1, n2, container) => {
    if (n1 === n2) {
      //两个vnode相同直接return掉
      return
    }
    if (isNull(n1)) {
      mountElement(n2, container)
    } else {
    }
  }
  //#endregion

  const render = (vnode, container) => {
    if (isNull(vnode)) {
      if (container._vnode) {
        //卸载
        unmount(container._vnode)
      }
    } else {
      //挂载和更新
      patch(container._vnode || null, vnode, container)
    }
    container._vnode = vnode
  }
  return {
    render
  }
}
