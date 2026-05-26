import { describe, expect, it, vi } from 'vitest'
import { effect, ref } from '../src/index'

describe('effect', () => {
  it('skips recursive trigger when an effect mutates its own ref like 01-demo', () => {
    const count = ref(0)
    const logs: number[] = []

    effect(() => {
      logs.push(count.value++)
    }, {} as any)

    expect(logs).toEqual([0])
    expect(count.value).toBe(1)
  })

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

  it('cleans up stale branch dependencies when switching refs like the demo', () => {
    const name = ref('mason')
    const age = ref(10)
    const flag = ref(true)
    let dummy: string | number
    let runCount = 0

    effect(() => {
      runCount++
      if (flag.value) {
        dummy = age.value
      } else {
        dummy = name.value
      }
    }, {} as any)

    expect(dummy!).toBe(10)
    expect(runCount).toBe(1)

    flag.value = false

    expect(dummy!).toBe('mason')
    expect(runCount).toBe(2)

    age.value++

    expect(dummy!).toBe('mason')
    expect(runCount).toBe(2)

    name.value = 'vue'

    expect(dummy!).toBe('vue')
    expect(runCount).toBe(3)
  })

  it('cleans up all dependencies when rerun returns without tracking any refs', () => {
    const age = ref(10)
    let shouldTrack = true
    let dummy = 0
    let runCount = 0

    const runner = effect(() => {
      runCount++
      if (!shouldTrack) {
        return
      }
      dummy = age.value
    }, {} as any)

    expect(dummy).toBe(10)
    expect(runCount).toBe(1)

    shouldTrack = false
    runner()

    expect(runCount).toBe(2)

    age.value++

    expect(dummy).toBe(10)
    expect(runCount).toBe(2)
  })
})
