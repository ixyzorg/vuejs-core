import { describe, expect, it } from 'vitest'
import { effect, isReactive, reactive } from '../src/index'

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
