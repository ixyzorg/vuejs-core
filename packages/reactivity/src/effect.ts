export let activeSub

class ReactiveEffect {
  constructor(public fn) {}

  run() {
    const prevSub = activeSub //处理effect嵌套问题
    activeSub = this
    try {
      return this.fn()
    } finally {
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
