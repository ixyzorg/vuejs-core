import { isObject } from '@vue/shared'
import { link, Dep, Link, propagate } from './system'
import { activeSub } from './effect'
import { ReactiveFlags } from './ref'

export function reactive(target: Object) {
  return createReactiveObject(target)
}

//保存代理对象与原始对象之间的关系
const reactiveMap = new WeakMap()

const mutableHandlers = {
  get(target, p, receiver) {
    if (p === ReactiveFlags.IS_REACTIVE) {
      return true
    }
    track(target, p)
    return Reflect.get(target, p, receiver)
  },
  set(target, p, newValue, receiver) {
    const res = Reflect.set(target, p, newValue, receiver)
    trigger(target, p)
    return res
  }
}

function createReactiveObject(target: Object) {
  if (!isObject(target)) {
    return target
  }

  /**
   * @description 这种情况a===b
   * const a1 = {
        name: '123'
      }
      const a = reactive(a1)
      const b = reactive(a1)
   */
  const existingProxy = reactiveMap.get(target)
  if (existingProxy) {
    return existingProxy
  }

  const proxy = new Proxy(target, mutableHandlers)

  reactiveMap.set(target, proxy)
  return proxy
}

const targetMap = new WeakMap()

function track(target: Object, key: PropertyKey) {
  if (!activeSub) {
    return
  }
  let depsMap = targetMap.get(target)
  if (!depsMap) {
    depsMap = new Map()
    targetMap.set(target, depsMap)
  }
  let dep = depsMap.get(key)
  if (!dep) {
    dep = new DepImpl()
    depsMap.set(key, dep)
  }

  link(dep, activeSub)
}

function trigger(target: Object, key: PropertyKey) {
  const depsMap = targetMap.get(target)
  if (!depsMap) {
    return
  }
  const dep = depsMap.get(key)
  if (!dep) {
    return
  }
  propagate(dep.subs)
}

class DepImpl implements Dep {
  subs: Link
  subsTail: Link
  constructor() {}
}

export function isReactive(value) {
  return !!(value && value[ReactiveFlags.IS_REACTIVE])
}
