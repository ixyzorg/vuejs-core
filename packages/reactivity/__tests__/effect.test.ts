import { describe, expect, it, vi } from 'vitest'
import { effect, ref } from '../src/index'

describe('effect', () => {
  it('handles nested effects when ref updates asynchronously', () => {
    vi.useFakeTimers()

    try {
      const a = ref(1)
      const logs: number[] = []

      effect(() => {
        effect(() => {
          logs.push(a.value)
        }, {} as any)
        logs.push(a.value)
      }, {} as any)

      expect(logs).toEqual([1, 1])

      setTimeout(() => {
        a.value = 2
      }, 1000)

      vi.advanceTimersByTime(1000)

      expect(logs).toEqual([1, 1, 2, 2, 2])
    } finally {
      vi.useRealTimers()
    }
  })

  it('updates reactivity when scheduler calls runner.effect.run()', () => {
    const a = ref(1)
    let dummy = 0
    let runCount = 0
    let runner: any

    const scheduler = vi.fn(() => {
      runner.effect.run()
    })

    runner = effect(() => {
      runCount++
      dummy = a.value
    }, { scheduler } as any)

    expect(dummy).toBe(1)
    expect(runCount).toBe(1)

    a.value = 2

    expect(scheduler).toHaveBeenCalledTimes(1)
    expect(dummy).toBe(2)
    expect(runCount).toBe(2)
    expect(a.value).toBe(2)
  })
})
