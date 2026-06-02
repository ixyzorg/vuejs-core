import { isFn, isObject } from '@vue/shared'
import { ReactiveEffect } from './effect'
import { isRef } from './ref'
import { isReactive } from './reactive'

interface Options {
  once?: true
  deep?: number | true
  immediate?: true
}

type OnCleanup = (cleanupFn: () => void) => void

export function watch(
  source: any,
  callback: (newValue: any, oldValue: any, onCleanup: OnCleanup) => void,
  options: Options
) {
  let { immediate, once, deep } = options ?? {}

  if (once) {
    const _callback = callback
    callback = (...args) => {
      _callback(...args)
      stop()
    }
  }

  let getter
  if (isRef(source)) {
    getter = () => source.value
  } else if (isReactive(source)) {
    getter = () => source
    if (!deep) {
      deep = true
    }
  } else if (isFn(source)) {
    getter = source
  }

  if (deep) {
    const baseGetter = getter
    const depth = deep === true ? Infinity : deep
    getter = () => traverse(baseGetter(), depth)
  }

  let oldValue: any
  let cleanup: (() => void) | undefined
  function onCleanup(cleanupFn: () => void) {
    cleanup = cleanupFn
  }
  function job() {
    if (cleanup) {
      cleanup()
      cleanup = undefined
    }
    const newValue = effect.run()
    callback(newValue, oldValue, onCleanup)
    oldValue = newValue
  }

  const effect = new ReactiveEffect(getter)
  effect.scheduler = job
  const stop = () => {
    if (cleanup) {
      cleanup()
      cleanup = undefined
    }
    effect.stop()
  }
  if (immediate) {
    job()
  } else {
    oldValue = effect.run()
  }
  return stop
}

function traverse(value, depth = Infinity, seen = new Set()) {
  if (!isObject(value)) {
    return value
  }
  if (seen.has(value)) {
    return value
  }
  if (depth <= 0) {
    return value
  }
  depth--
  seen.add(value)
  for (const key in value) {
    traverse(value[key], depth, seen)
  }
  return value
}
