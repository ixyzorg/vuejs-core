import { hasChanged, isFn } from '@vue/shared'
import { ReactiveFlags, trackRef } from './ref'
import { Dep, Link, Sub } from './system'
import { activeSub, startTrack, endTrack, setActiveSub } from './effect'

/* 第一次访问 c.value
dirty = true
执行 getter
缓存结果
dirty = false

再次访问 c.value
dirty = false
直接返回缓存

依赖 count 改变
dirty = true

再次访问 c.value
重新执行 getter
更新缓存
dirty = false */

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
  dirty = true //为true时,重新执行update否则直接返回缓存
  constructor(
    public fn,
    private setter
  ) {}
  get value() {
    if (this.dirty) {
      this.update()
    }
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
      const oldVal = this._value
      this._value = this.fn()
      this.dirty = false
      return hasChanged(oldVal, this._value)
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
