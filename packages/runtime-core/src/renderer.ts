import { isNull, ShapeFlags } from '@vue/shared'
import { isSameVnode } from './vnode'

export function createRenderer(options) {
  const {
    createElement: hostCreateElement,
    insert: hostInsert,
    setElementText: hostSetElementText,
    remove: hostRemove,
    createText: hostCreateText,
    setText: hostSetText,
    parentNode: hostParentNode,
    nextSibling: hostNextSibling,
    querySelector: hostQuerySelector,
    patchProp: hostPatchProp
  } = options

  const unmount = (vnode) => {
    const { shapeFlag, type, children } = vnode
    if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      unmountChildren(children)
    }
    hostRemove(vnode.el)
  }
  const unmountChildren = (children) => {
    for (const child of children) {
      unmount(child)
    }
  }

  const mountElement = (vnode, container, anchor = null) => {
    /* 
      1 创建DOM元素
      2 设置props
      3 挂载子节点
    */
    const { type, props, children, shapeFlag } = vnode
    const el = hostCreateElement(type)
    vnode.el = el

    if (props) {
      for (const key in props) {
        hostPatchProp(el, key, null, props[key])
      }
    }

    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      hostSetElementText(el, children)
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(children, el)
    }

    hostInsert(el, container, anchor)
  }

  const mountChildren = (children, el) => {
    for (const child of children) {
      patch(null, child, el)
    }
  }
  const patchProps = (el, oldProps, newProps) => {
    for (const key in oldProps) {
      hostPatchProp(el, key, oldProps?.[key], null)
    }
    for (const key in newProps) {
      hostPatchProp(el, key, oldProps?.[key], newProps[key])
    }
  }

  const patchKeyedChildren = (c1, c2, container) => {
    // 全量diff
    //1.1 双端diff
    /*  
      头部对比[a,b] =>[a,b,c,d]
      开始时 i= 0 e1 = 1 e2 = 3
      结束时 i =2 e1 = 1 e2 = 3
    */

    let i = 0 //开始对比的下标
    let e1 = c1.length - 1 //老的子节点的最后一个节点下标
    let e2 = c2.length - 1 //新的子节点的最后一个节点下标

    while (i <= e1 && i <= e2) {
      const n1 = c1[i]
      const n2 = c2[i]

      if (isSameVnode(n1, n2)) {
        patch(n1, n2, container)
      } else {
        break
      }
      i++
    }

    /* 
      尾部对比[a,b] =>[d,c,a,b]
      开始时 i= 0 e1 = 1 e2 = 3
      结束时 i= 0 e1 = -1 e2 = 1
    */
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1]
      const n2 = c2[e2]
      if (isSameVnode(n1, n2)) {
        patch(n1, n2, container)
      } else {
        break
      }
      e1--
      e2--
    }

    if (i > e1) {
      /* 
        老的少，新的多，挂载新的
      */
      const nextPos = e2 + 1
      const anchor = nextPos < c2.length ? c2[nextPos]?.el : null

      while (i <= e2) {
        patch(null, c2[i], container, anchor)
        i++
      }
    } else if (i > e2) {
      // 老的多，新的少，卸载旧的
      while (i <= e1) {
        unmount(c1[i])
        i++
      }
    }
  }

  const patchChildren = (n1, n2) => {
    const el = n2.el
    /* 
    1 新的是文本
    1.1 旧的是数组
    1.2 旧的是文本
    2 新的是数组
    2.1 旧的是文本
    2.1 旧的是数组 
    */
    const prevShapeFlag = n1.shapeFlag
    const shapeFlag = n2.shapeFlag
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        unmountChildren(n1.children)
      }
      if (n1.children !== n2.children) {
        hostSetElementText(el, n2.children)
      }
    } else {
      if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
        hostSetElementText(el, '')
        mountChildren(n2.children, el)
      } else {
        patchKeyedChildren(n1.children, n2.children, el)
      }
    }
  }

  const patchElement = (n1, n2) => {
    /*
      1.复用DOM元素
      2.更新Props
      3.更新children
     */
    const el = (n2.el = n1.el)
    const oldProps = n1.props
    const newProps = n2.props
    patchProps(el, oldProps, newProps)
    patchChildren(n1, n2)
  }

  //#region 挂载、更新
  const patch = (n1, n2, container, anchor = null) => {
    if (n1 === n2) {
      //两个vnode相同直接return掉
      return
    }
    if (n1 && !isSameVnode(n1, n2)) {
      //两个节点不是同一个节点，卸载n1，直接挂载n2
      unmount(n1)
      n1 = null
    }
    if (isNull(n1)) {
      //挂载
      mountElement(n2, container, anchor)
    } else {
      //更新
      patchElement(n1, n2)
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
