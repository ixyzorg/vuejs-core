import { describe, expect, it } from 'vitest'
import {
  effect,
  isReactive,
  isRef,
  proxyRefs,
  reactive,
  ref,
  toRef,
  toRefs,
  unRef
} from '../src/index'

function countSubs(dep: any) {
  let count = 0
  let current = dep.subs
  while (current) {
    count++
    current = current.nextSub
  }
  return count
}

function countDeps(sub: any) {
  let count = 0
  let current = sub.deps
  while (current) {
    count++
    current = current.nextDep
  }
  return count
}

describe('ref', () => {
  it('re-runs effect when ref value changes', () => {
    const count = ref(1)
    let dummy = 0
    let runCount = 0

    effect(() => {
      runCount++
      dummy = count.value
    }, {} as any)

    expect(dummy).toBe(1)
    expect(runCount).toBe(1)

    count.value = 2

    expect(dummy).toBe(2)
    expect(runCount).toBe(2)
  })

  it('runs effect once when a ref read multiple times changes', () => {
    const r = ref(1)
    let runCount = 0

    effect(() => {
      runCount++
      r.value
      r.value
    }, {} as any)

    expect(runCount).toBe(1)

    r.value = 2

    expect(runCount).toBe(2)
  })

  it('does not re-run effect when ref value stays the same', () => {
    const count = ref(1)
    let dummy = 0
    let runCount = 0

    effect(() => {
      runCount++
      dummy = count.value
    }, {} as any)

    count.value = 1

    expect(dummy).toBe(1)
    expect(runCount).toBe(1)
  })

  it('isRef detects ref values correctly', () => {
    const count = ref(1)
    const plain = 1

    expect(isRef(count)).toBe(true)
    expect(isRef(plain)).toBe(false)
    expect(isRef(null)).toBe(false)
  })

  it('toRef keeps a property in sync with its source object', () => {
    const state = reactive({ count: 1 })
    const count = toRef(state, 'count')

    expect(isRef(count)).toBe(true)
    expect(count.value).toBe(1)

    count.value = 2
    expect(state.count).toBe(2)

    state.count = 3
    expect(count.value).toBe(3)
  })

  it('toRefs keeps each property in sync with its source object', () => {
    const state = reactive({ count: 1, name: 'mason' })
    const refs = toRefs(state)

    expect(isRef(refs.count)).toBe(true)
    expect(isRef(refs.name)).toBe(true)

    refs.count.value = 2
    expect(state.count).toBe(2)

    state.name = 'evan'
    expect(refs.name.value).toBe('evan')
  })

  it('unref returns the inner value for refs and leaves other values unchanged', () => {
    const count = ref(1)
    const user = { name: 'mason' }

    expect(unRef(count)).toBe(1)
    expect(unRef(user)).toBe(user)
  })

  it('proxyRefs unwraps refs on get and preserves ref assignment behavior', () => {
    const count = ref(1)
    const user = proxyRefs({
      count,
      name: 'mason'
    })

    expect(user.count).toBe(1)
    expect(user.name).toBe('mason')

    user.count = 2
    expect(user.count).toBe(2)
    expect(count.value).toBe(2)

    const replacement = ref(3)
    user.count = replacement
    expect(user.count).toBe(3)
    expect(count.value).toBe(2)
  })

  it('converts object values to reactive proxies', () => {
    const user = ref({ name: 'mason' })

    expect(isReactive(user.value)).toBe(true)
  })

  it('tracks effects that read properties from an object ref value', () => {
    const user = ref({ name: 'mason' })
    let dummy = ''
    let runCount = 0

    effect(() => {
      runCount++
      dummy = user.value.name
    }, {} as any)

    expect(dummy).toBe('mason')
    expect(runCount).toBe(1)

    user.value.name = 'evan'

    expect(dummy).toBe('evan')
    expect(runCount).toBe(2)
  })

  it('链表节点复用,防止,更新时避免重复收集', () => {
    const f = ref(true) as any
    let effectRunCount = 0

    const runner = effect(() => {
      f.value
      effectRunCount++
    }, {} as any) as any

    const firstSubLink = f.subs
    const firstDepLink = runner.effect.deps

    expect(firstSubLink).toBeDefined()
    expect(firstDepLink).toBeDefined()
    expect(firstSubLink).toBe(firstDepLink)
    expect(countSubs(f)).toBe(1)

    for (let i = 0; i < 5; i++) {
      f.value = !f.value
      expect(f.subs).toBe(firstSubLink)
      expect(f.subsTail).toBe(firstSubLink)
      expect(runner.effect.deps).toBe(firstDepLink)
      expect(runner.effect.depsTail).toBe(firstDepLink)
      expect(countSubs(f)).toBe(1)
    }

    expect(effectRunCount).toBe(6)
  })

  it('两个响应式数据在effect中也会复用链表节点', () => {
    const f1 = ref(true) as any
    const f2 = ref(0) as any
    let effectRunCount = 0

    const runner = effect(() => {
      f1.value
      f2.value
      effectRunCount++
    }, {} as any) as any

    const firstLink1 = f1.subs
    const firstLink2 = f2.subs

    expect(firstLink1).toBeDefined()
    expect(firstLink2).toBeDefined()
    expect(firstLink1).not.toBe(firstLink2)
    expect(runner.effect.deps).toBe(firstLink1)
    expect(runner.effect.deps.nextDep).toBe(firstLink2)
    expect(runner.effect.depsTail).toBe(firstLink2)
    expect(countDeps(runner.effect)).toBe(2)
    expect(countSubs(f1)).toBe(1)
    expect(countSubs(f2)).toBe(1)

    f1.value = !f1.value
    f2.value = 1
    f1.value = !f1.value
    f2.value = 2

    expect(f1.subs).toBe(firstLink1)
    expect(f1.subsTail).toBe(firstLink1)
    expect(f2.subs).toBe(firstLink2)
    expect(f2.subsTail).toBe(firstLink2)
    expect(runner.effect.deps).toBe(firstLink1)
    expect(runner.effect.deps.nextDep).toBe(firstLink2)
    expect(runner.effect.depsTail).toBe(firstLink2)
    expect(countDeps(runner.effect)).toBe(2)
    expect(countSubs(f1)).toBe(1)
    expect(countSubs(f2)).toBe(1)
    expect(effectRunCount).toBe(5)
  })
})
