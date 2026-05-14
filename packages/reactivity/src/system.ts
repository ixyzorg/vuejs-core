export interface Link {
  sub
  nextSub: Link //next指针
  prevSub: Link //prev指针
}

/**
 * @description 订阅者与依赖项通过双向链表创建关联关系
 * @param dep ref reactive computed 依赖项
 * @param sub effect 订阅者
 */
export function link(dep, sub) {
  const newLink: Link = {
    sub,
    nextSub: undefined,
    prevSub: undefined
  }
  /**
   * 双向链表保存subs
   */
  if (dep.subsTail) {
    dep.subsTail.nextSub = newLink
    newLink.prevSub = dep.subsTail
    dep.subsTail = newLink
  } else {
    dep.subs = dep.subsTail = newLink
  }
}

/**
 * @description 传播更新
 * @param subs
 */
export function propagate(subs) {
  let link = subs
  const queuedEffect = []
  while (link) {
    queuedEffect.push(link.sub)
    link = link.nextSub
  }
  queuedEffect.forEach(fn => fn())
}
