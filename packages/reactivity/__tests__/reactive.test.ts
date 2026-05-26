import { describe, expect, it } from 'vitest'
import { effect, isReactive, reactive, ref } from '../src/index'

describe('reactive', () => {
  it('creates a proxy for object values', () => {
    const original = { count: 1 }
    const observed = reactive(original)

    expect(observed).not.toBe(original)
    expect(observed.count).toBe(1)
  })

  it('re-runs effect when reactive property changes', () => {
    const state = reactive({ count: 1 })
    let dummy = 0
    let runCount = 0

    effect(() => {
      runCount++
      dummy = state.count
    }, {} as any)

    expect(dummy).toBe(1)
    expect(runCount).toBe(1)

    state.count = 2

    expect(dummy).toBe(2)
    expect(runCount).toBe(2)
  })

  it('re-runs effect when nested reactive object property changes', () => {
    const state = reactive({
      user: {
        profile: {
          age: 18
        }
      }
    })
    let dummy = 0
    let runCount = 0

    effect(() => {
      runCount++
      dummy = state.user.profile.age
    }, {} as any)

    expect(dummy).toBe(18)
    expect(runCount).toBe(1)

    state.user.profile.age = 19

    expect(dummy).toBe(19)
    expect(runCount).toBe(2)
  })

  it('unwraps ref properties and re-runs effect when assigning through reactive', () => {
    const count = ref(1)
    const state = reactive({ count })
    let dummy = 0
    let runCount = 0

    effect(() => {
      runCount++
      dummy = state.count
    }, {} as any)

    expect(state.count).toBe(1)
    expect(dummy).toBe(1)
    expect(runCount).toBe(1)

    state.count = 2

    expect(count.value).toBe(2)
    expect(state.count).toBe(2)
    expect(dummy).toBe(2)
    expect(runCount).toBe(2)
  })

  it('does not re-run effect when reactive property value stays the same', () => {
    const state = reactive({ count: 1 })
    let dummy = 0
    let runCount = 0

    effect(() => {
      runCount++
      dummy = state.count
    }, {} as any)

    state.count = 1

    expect(dummy).toBe(1)
    expect(runCount).toBe(1)
  })

  it('reuses the same proxy for the same original object', () => {
    const original = { count: 1 }

    expect(reactive(original)).toBe(reactive(original))
  })

  it('returns non-object values directly', () => {
    expect(reactive(1 as any)).toBe(1)
    expect(reactive(null as any)).toBe(null)
  })
})

describe('isReactive', () => {
  it('detects reactive proxies correctly', () => {
    const observed = reactive({ count: 1 })
    const original = { count: 1 }

    expect(isReactive(observed)).toBe(true)
    expect(isReactive(original)).toBe(false)
    expect(isReactive(null)).toBe(false)
  })
})
