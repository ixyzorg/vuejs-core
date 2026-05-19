import { describe, expect, it } from 'vitest'
import { effect, isRef, ref } from '../src/index'

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

  it('isRef detects ref values correctly', () => {
    const count = ref(1)
    const plain = 1

    expect(isRef(count)).toBe(true)
    expect(isRef(plain)).toBe(false)
    expect(isRef(null)).toBe(false)
  })
})
