import { hasChanged, isObject } from '@vue/shared'
import { activeSub } from './effect'
import { Link, link, propagate } from './system'
import { reactive } from './reactive'

export enum ReactiveFlags {
  IS_REF = '__v_isRef',
  IS_REACTIVE = '__v_isReactive'
}
class RefImpl {
  [ReactiveFlags.IS_REF] = true //ref判断标识
  _value
  subs: Link
  subsTail: Link
  constructor(value) {
    this._value = isObject(value) ? reactive(value) : value
  }

  get value() {
    trackRef(this)
    return this._value
  }

  set value(newVal) {
    const oldVal = this._value
    if (!hasChanged(oldVal, newVal)) {
      return
    }
    this._value = isObject(newVal) ? reactive(newVal) : newVal
    triggerRef(this)
  }
}

export function ref(value) {
  return new RefImpl(value)
}

/**
 * @description 收集依赖
 * @param dep
 */
export function trackRef(dep) {
  if (activeSub) {
    link(dep, activeSub)
  }
}
/**
 * @description 触发更新
 * @param dep
 */
function triggerRef(dep) {
  propagate(dep.subs)
}

/**
 * @description 判断是否是ref
 * @param r
 * @returns Boolean
 */
export function isRef(r: any) {
  return r ? r[ReactiveFlags.IS_REF] === true : false
}

class ObjectRefIml {
  [ReactiveFlags.IS_REF] = true
  constructor(
    public _object,
    public _key
  ) {}
  get value() {
    return this._object[this._key]
  }
  set value(newVal) {
    this._object[this._key] = newVal
  }
}

export function toRef(target, key) {
  return new ObjectRefIml(target, key)
}

export function toRefs(target) {
  const res = {}
  for (const key in target) {
    res[key] = new ObjectRefIml(target, key)
  }
  return res as any
}

export function unRef(value) {
  return isRef(value) ? value.value : value
}

export function proxyRefs(target) {
  return new Proxy(target, {
    get(target, p, receiver) {
      const res = Reflect.get(target, p, receiver)
      return unRef(res)
    },
    set(target, p, newValue, receiver) {
      const oldValue = target[p]

      if (isRef(oldValue) && !isRef(newValue)) {
        oldValue.value = newValue
        return true
      }
      
      return Reflect.set(target, p, newValue, receiver)
    }
  })
}
