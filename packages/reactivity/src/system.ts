export interface Sub {
  deps: Link
  depsTail: Link
  tracking: boolean
  dirty?: boolean
}

export interface Dep {
  subs: Link
  subsTail: Link
}

export interface Link {
  sub: Sub
  nextSub: Link //next指针
  prevSub: Link //prev指针
  dep: Dep
  nextDep: Link
}

/**
 * @description 订阅者与依赖项通过双向链表创建关联关系
 * @param dep ref reactive computed 依赖项
 * @param sub effect 订阅者
 */
export function link(dep: Dep, sub: Sub) {
  /**
   * todo 实现Link节点的复用
   */
  const currentDep = sub.depsTail
  const nextDep = currentDep === undefined ? sub.deps : sub.depsTail.nextDep
  if (nextDep && nextDep.dep === dep) {
    sub.depsTail = nextDep
    return
  }

  const newLink: Link = {
    sub,
    nextSub: undefined,
    prevSub: undefined,
    dep,
    nextDep
  }
  /**
   * Dep双向链表存储Link
   */
  if (dep.subsTail) {
    dep.subsTail.nextSub = newLink
    newLink.prevSub = dep.subsTail
    dep.subsTail = newLink
  } else {
    dep.subs = dep.subsTail = newLink
  }
  /**
   * ReactiveEffect实例单向链表存储Link
   */
  if (sub.depsTail) {
    sub.depsTail.nextDep = newLink
    sub.depsTail = newLink
  } else {
    sub.deps = sub.depsTail = newLink
  }
}

/**
 * @description 传播更新
 * @param subs
 */
export function propagate(subs: Link) {
  let link = subs
  const queuedEffect = []
  while (link) {
    const sub = link.sub
    if (!sub.tracking && !sub.dirty) {
      sub.dirty = true
      if (Reflect.has(sub, 'update')) {
        processComputedProgress(sub)
      } else {
        queuedEffect.push(link.sub)
      }
    }
    link = link.nextSub
  }
  queuedEffect.forEach(effect => effect.notify())
}

/**
 *@description 更新计算属性 通知effect重新执行
 */
function processComputedProgress(sub) {
  if (sub.subs && sub.update()) {
    propagate(sub.subs)
  }
}
