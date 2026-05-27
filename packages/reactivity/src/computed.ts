import { isFn } from '@vue/shared'
import { ReactiveFlags, trackRef } from './ref'
import { Dep, Link, Sub } from './system'
import { activeSub, startTrack, endTrack, setActiveSub } from './effect'

type GetterOrOptions =
  | (() => any)
  | {
      get: () => any

      set: (value) => void
    }

class ComputedImpl implements Sub, Dep {
  subs: Link
  subsTail: Link
  deps: Link
  depsTail: Link
  tracking = false;
  [ReactiveFlags.IS_REF] = true
  _value //保存fn的返回值
  constructor(
    public fn,
    private setter
  ) {}
  get value() {
    this.update()
    trackRef(this) //作为Dep时,与effect建立关联关系
    return this._value
  }

  set value(newVal) {
    if (this.setter) {
      this.setter(newVal)
    } else {
      console.warn('我是只读的')
    }
  }

  update() {
    /**
     * @description 实现Sub的功能与effect的run函数一致
     */
    const prevSub = activeSub
    startTrack(this)
    setActiveSub(this)
    try {
      this._value = this.fn()
    } finally {
      endTrack(this)
      setActiveSub(prevSub)
    }
  }
}

export function computed(getterOrOptions: GetterOrOptions) {
  let getter
  let setter
  if (isFn(getterOrOptions)) {
    getter = getterOrOptions
  } else {
    getter = getterOrOptions.get
    setter = getterOrOptions.set
  }
  return new ComputedImpl(getter, setter)
}
