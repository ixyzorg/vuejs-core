import { isObject } from '@vue/shared'
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
    this._value = isObject(newVal) ? reactive(newVal) : newVal
    triggerRef(this)
  }
}

export function ref(value) {
  return new RefImpl(value)
}

/**
 * @description 判断是否是ref
 * @param r
 * @returns Boolean
 */
export function isRef(r: any) {
  return r ? r[ReactiveFlags.IS_REF] === true : false
}

/**
 * @description 收集依赖
 * @param dep
 */
function trackRef(dep) {
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
