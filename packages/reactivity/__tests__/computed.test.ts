import { describe, expect, it, vi } from 'vitest'
import { computed, effect, ref } from '../src/index'

describe('computed', () => {
  it('evaluates lazily and caches the computed value', () => {
    const count = ref(1)
    const getter = vi.fn(() => count.value + 1)
    const plusOne = computed(getter)

    expect(getter).not.toHaveBeenCalled()

    expect(plusOne.value).toBe(2)
    expect(getter).toHaveBeenCalledTimes(1)

    expect(plusOne.value).toBe(2)
    expect(getter).toHaveBeenCalledTimes(1)
  })

  it('recomputes when its dependency changes', () => {
    const count = ref(1)
    const getter = vi.fn(() => count.value + 1)
    const plusOne = computed(getter)

    expect(plusOne.value).toBe(2)
    expect(getter).toHaveBeenCalledTimes(1)

    count.value++

    expect(plusOne.value).toBe(3)
    expect(getter).toHaveBeenCalledTimes(2)
  })

  it('re-runs effects that depend on a computed value', () => {
    const count = ref(1)
    const plusOne = computed(() => count.value + 1)
    let dummy = 0
    let runCount = 0

    effect(() => {
      runCount++
      dummy = plusOne.value
    }, {} as any)

    expect(dummy).toBe(2)
    expect(runCount).toBe(1)

    count.value++

    expect(dummy).toBe(3)
    expect(runCount).toBe(2)
  })

  it('does not re-run effects when the computed result stays the same', () => {
    const count = ref(1)
    const parity = computed(() => count.value % 2)
    let dummy = 0
    let runCount = 0

    effect(() => {
      runCount++
      dummy = parity.value
    }, {} as any)

    expect(dummy).toBe(1)
    expect(runCount).toBe(1)

    count.value += 2

    expect(dummy).toBe(1)
    expect(runCount).toBe(1)
  })

  it('supports writable computed refs', () => {
    const count = ref(1)
    const plusOne = computed({
      get: () => count.value + 1,
      set: value => {
        count.value = value - 1
      }
    })

    plusOne.value = 10

    expect(count.value).toBe(9)
    expect(plusOne.value).toBe(10)
  })

  it('warns when writing to a readonly computed ref', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const plusOne = computed(() => 2)

    try {
      plusOne.value = 3

      expect(warn).toHaveBeenCalledTimes(1)
      expect(warn).toHaveBeenCalledWith('我是只读的')
      expect(plusOne.value).toBe(2)
    } finally {
      warn.mockRestore()
    }
  })
})
