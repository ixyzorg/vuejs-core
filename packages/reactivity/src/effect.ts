import { Link, Sub } from './system'

export let activeSub

class ReactiveEffect {
  constructor(public fn) {}
  deps: Link
  depsTail: Link
  run() {
    const prevSub = activeSub //处理effect嵌套问题
    startTrack(this)
    activeSub = this
    try {
      return this.fn()
    } finally {
      endTrack(this)
      activeSub = prevSub
    }
  }
  scheduler() {
    this.run()
  }

  notify() {
    this.scheduler()
  }
}

function startTrack(sub: Sub) {
  sub.depsTail = undefined //标记 每次重新执行时将尾节点置为undefined
}

function endTrack(sub: Sub) {
  const depsTail = sub.depsTail
  if (depsTail) {
    if (depsTail.nextDep) {
      clearTrack(depsTail.nextDep)
      depsTail.nextDep = undefined
    }
  } else if (sub.deps) {
    clearTrack(sub.deps)
    sub.deps = undefined
  }
}

/**
 * @description 分支切换清理依赖
 * @param link
 */
function clearTrack(link: Link) {
  while (link) {
    const { dep, prevSub, nextSub, nextDep } = link
    if (prevSub) {
      prevSub.nextSub = nextSub
      link.nextSub = undefined
    } else {
      dep.subs = nextSub
    }
    if (nextSub) {
      nextSub.prevSub = prevSub
      link.prevSub = undefined
    } else {
      dep.subsTail = prevSub
    }
    link.nextDep = link.dep = link.sub = undefined
    link = nextDep
  }
}

interface Options {
  scheduler: () => void
}
export function effect(fn, options: Options) {
  const e = new ReactiveEffect(fn)
  Object.assign(e, options)
  e.run()
  const runner = e.run.bind(e)
  runner.effect = e
  return runner
}
