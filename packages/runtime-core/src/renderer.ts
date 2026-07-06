import { isNull, ShapeFlags } from '@vue/shared'
import { Text, isSameVnode, normalizeVNode } from './vnode'
import { createAppAPI } from './apiCreateApp'
import { createComponentInstance, setupComponent } from './component'
import { ReactiveEffect } from '@vue/reactivity'

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
    for (let i = 0; i < children.length; i++) {
      const child = (children[i] = normalizeVNode(children[i]))
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
      const n2 = (c2[i] = normalizeVNode(c2[i]))

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
      const n2 = (c2[e2] = normalizeVNode(c2[e2]))
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
        patch(null, (c2[i] = normalizeVNode(c2[i])), container, anchor)
        i++
      }
    } else if (i > e2) {
      // 老的多，新的少，卸载旧的
      while (i <= e1) {
        unmount(c1[i])
        i++
      }
    } else {
      // 1.2乱序对比
      /* 
      老的c1=[a,b,c,d,e]
      新的c2=[a,c,d,b,e] 
      开始时 i=0 e1 = 4 e2 =4
      双端对比完成时 i=1 e1=3 e2 =3
    */
      let s1 = i
      let s2 = i

      const keyToNewIndexMap = new Map()
      const newIndexToOldIndexMap = new Array(e2 - s2 + 1)
      let maxNewIndexSoFar = 0
      let moved = false
      newIndexToOldIndexMap.fill(-1)

      for (let j = s2; j <= e2; j++) {
        const n2 = (c2[j] = normalizeVNode(c2[j]))
        keyToNewIndexMap.set(n2.key, j)
      }

      for (let j = s1; j <= e1; j++) {
        const n1 = c1[j]
        const newIndex = keyToNewIndexMap.get(n1.key)
        if (newIndex !== undefined) {
          newIndexToOldIndexMap[newIndex - s2] = j
          if (newIndex >= maxNewIndexSoFar) {
            maxNewIndexSoFar = newIndex
          } else {
            moved = true
          }
          patch(n1, c2[newIndex], container)
        } else {
          unmount(n1)
        }
      }
      // 只有节点需要移动时，才需要最长递增子序列
      const newIndexSequence = moved ? getSequence(newIndexToOldIndexMap) : []
      let sequenceIndex = newIndexSequence.length - 1
      //倒序插入保持顺序一致
      for (let j = e2; j >= s2; j--) {
        const n2 = c2[j]
        const anchor = c2[j + 1]?.el
        if (n2.el) {
          const currentIndex = j - s2
          if (moved && newIndexSequence[sequenceIndex] !== currentIndex) {
            hostInsert(n2.el, container, anchor)
          } else {
            sequenceIndex--
          }
        } else {
          patch(null, n2, container, anchor)
        }
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

  const processElement = (n1, n2, container, anchor) => {
    if (isNull(n1)) {
      //挂载
      mountElement(n2, container, anchor)
    } else {
      //更新
      patchElement(n1, n2)
    }
  }

  const processText = (n1, n2, container, anchor) => {
    if (isNull(n1)) {
      //挂载
      const el = hostCreateText(n2.children)
      n2.el = el
      hostInsert(el, container, anchor)
    } else {
      //更新
      n2.el = n1.el
      if (n1.children !== n2.children) {
        hostSetText(n2.el, n2.children)
      }
    }
  }

  function mountComponent(vnode, container, anchor) {
    /* 
      1.创建组件实例
      2.初始化组件状态
      3.将组件挂载到页面
    */
    const instance = createComponentInstance(vnode)
    setupComponent(instance)
    
    
    const updateComponentFn = () => {
      if (!instance.isMounted) {
        const subTree = instance.render.call(instance.proxy) //改变this指向
        patch(null, subTree, container, anchor)
        instance.isMounted = true
        instance.subTree = subTree
      } else {
        const subTree = instance.render.call(instance.setupState)
        patch(instance.subTree, subTree, container, anchor)
        instance.subTree = subTree
      }
    }
    const effect = new ReactiveEffect(updateComponentFn)
    effect.run()
  }

  function patchComponent(n1, n2) {}

  function processComponent(n1, n2, container, anchor) {
    if (isNull(n1)) {
      //挂载
      mountComponent(n2, container, anchor)
    } else {
      //更新
      patchComponent(n1, n2)
    }
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
    const { shapeFlag, type } = n2
    switch (type) {
      case Text:
        processText(n1, n2, container, anchor)
        break
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, anchor)
        } else if (shapeFlag & ShapeFlags.COMPONENT) {
          processComponent(n1, n2, container, anchor)
        }
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
    render,
    createApp: createAppAPI(render)
  }
}

// 求最长递增子序列
function getSequence(arr) {
  const result = [] // result 存索引
  const map = new Map() // key: 当前索引，value: 前驱索引

  for (let i = 0; i < arr.length; i++) {
    const item = arr[i]

    if (item === -1) {
      continue
    }

    if (result.length === 0) {
      result.push(i)
      continue
    }

    const lastIndex = result[result.length - 1]
    const lastItem = arr[lastIndex]
    // 当前值比最后一个大，直接追加
    if (item > lastItem) {
      map.set(i, lastIndex)
      result.push(i)
      continue
    }

    // 二分：找第一个 >= item 的位置
    let left = 0
    let right = result.length - 1
    while (left < right) {
      const mid = Math.floor((left + right) / 2)
      const midItem = arr[result[mid]]
      if (midItem < item) {
        left = mid + 1
      } else {
        right = mid
      }
    }
    // 替换
    if (item < arr[result[left]]) {
      if (left > 0) {
        map.set(i, result[left - 1])
      }
      result[left] = i
    }
  }

  // 反向追溯
  let last = result[result.length - 1]
  const sequence = []
  while (last !== undefined) {
    sequence.unshift(last)
    last = map.get(last)
  }

  return sequence
}
