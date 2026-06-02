import { describe, expect, it, vi } from 'vitest'
import { reactive, ref, watch } from '../src/index'

describe('watch', () => {
  it('watches ref value changes with new and old values', () => {
    const count = ref(1)
    const spy = vi.fn()

    watch(count, spy, {})

    expect(spy).not.toHaveBeenCalled()

    count.value = 2

    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenLastCalledWith(2, 1, expect.any(Function))
  })

  it('runs ref watcher immediately when immediate is true', () => {
    const count = ref(1)
    const spy = vi.fn()

    watch(count, spy, { immediate: true })

    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenLastCalledWith(1, undefined, expect.any(Function))

    count.value = 2

    expect(spy).toHaveBeenCalledTimes(2)
    expect(spy).toHaveBeenLastCalledWith(2, 1, expect.any(Function))
  })

  it('stops ref watcher after the first callback when once is true', () => {
    const count = ref(1)
    const spy = vi.fn()

    watch(count, spy, { once: true })

    count.value = 2
    count.value = 3

    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenLastCalledWith(2, 1, expect.any(Function))
  })

  it('runs once watcher only during the immediate callback when both once and immediate are true', () => {
    const count = ref(1)
    const spy = vi.fn()

    watch(count, spy, { once: true, immediate: true })

    count.value = 2

    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenLastCalledWith(1, undefined, expect.any(Function))
  })

  it('watches reactive objects deeply by default', () => {
    const state = reactive({
      user: {
        profile: {
          age: 18
        }
      }
    })
    const spy = vi.fn()

    watch(state, spy, {})

    state.user.profile.age = 19

    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenLastCalledWith(state, state, expect.any(Function))
  })

  it('watches ref object nested changes when deep is true', () => {
    const state = ref({
      user: {
        profile: {
          age: 18
        }
      }
    })
    const spy = vi.fn()

    watch(state, spy, { deep: true })

    state.value.user.profile.age = 19

    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenLastCalledWith(
      state.value,
      state.value,
      expect.any(Function)
    )
  })

  it('respects numeric deep depth for ref object sources', () => {
    const state = ref({
      user: {
        profile: {
          age: 18
        }
      }
    })
    const spy = vi.fn()

    watch(state, spy, { deep: 1 })

    state.value.user.profile.age = 19

    expect(spy).not.toHaveBeenCalled()

    state.value.user = {
      profile: {
        age: 20
      }
    }

    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenLastCalledWith(
      state.value,
      state.value,
      expect.any(Function)
    )
  })

  it('runs previous cleanup before the next watcher callback', () => {
    const count = ref(0)
    const logs: string[] = []

    watch(
      count,
      (newValue, oldValue, onCleanup) => {
        logs.push(`callback ${newValue} ${oldValue}`)
        onCleanup(() => {
          logs.push(`cleanup ${newValue}`)
        })
      },
      {}
    )

    count.value = 1

    expect(logs).toEqual(['callback 1 0'])

    count.value = 2

    expect(logs).toEqual([
      'callback 1 0',
      'cleanup 1',
      'callback 2 1'
    ])
  })

  it('runs cleanup when watcher is stopped', () => {
    const count = ref(0)
    const cleanup = vi.fn()
    const spy = vi.fn((_, __, onCleanup) => {
      onCleanup(cleanup)
    })

    const stop = watch(count, spy, {})

    count.value = 1

    expect(cleanup).not.toHaveBeenCalled()

    stop()

    expect(cleanup).toHaveBeenCalledTimes(1)

    count.value = 2

    expect(spy).toHaveBeenCalledTimes(1)
    expect(cleanup).toHaveBeenCalledTimes(1)
  })
})
