import { describe, expect, it, vi } from 'vitest'
import { patchProp } from '../src/patchProp'

class FakeElement {
  attributes = new Map<string, unknown>()
  className = ''
  listeners = new Map<string, Set<(event: unknown) => void>>()
  style: Record<string, unknown> = {}

  setAttribute(key: string, value: unknown) {
    this.attributes.set(key, value)
  }

  removeAttribute(key: string) {
    this.attributes.delete(key)
    if (key === 'class') {
      this.className = ''
    }
  }

  addEventListener(name: string, handler: (event: unknown) => void) {
    const handlers = this.listeners.get(name) ?? new Set()
    handlers.add(handler)
    this.listeners.set(name, handlers)
  }

  removeEventListener(name: string, handler: (event: unknown) => void) {
    this.listeners.get(name)?.delete(handler)
  }

  dispatch(name: string, event: unknown = {}) {
    this.listeners.get(name)?.forEach(handler => handler(event))
  }
}

describe('runtime-dom patchProp', () => {
  it('patches class without writing a duplicate attribute', () => {
    const el = new FakeElement()

    patchProp(el, 'class', null, 'foo')
    expect(el.className).toBe('foo')
    expect(el.attributes.has('class')).toBe(false)

    patchProp(el, 'class', 'foo', null)
    expect(el.className).toBe('')
  })

  it('patches styles and removes stale style keys', () => {
    const el = new FakeElement()

    patchProp(el, 'style', null, { color: 'red', display: 'block' })
    expect(el.style).toMatchObject({ color: 'red', display: 'block' })
    expect(el.attributes.has('style')).toBe(false)

    patchProp(
      el,
      'style',
      { color: 'red', display: 'block' },
      { color: 'blue' },
    )

    expect(el.style.color).toBe('blue')
    expect(el.style.display).toBe('')

    patchProp(el, 'style', { color: 'blue' }, null)
    expect(el.style.color).toBe('')
  })

  it('patches attributes and removes them by key', () => {
    const el = new FakeElement()

    patchProp(el, 'id', null, 'app')
    expect(el.attributes.get('id')).toBe('app')

    patchProp(el, 'id', 'app', null)
    expect(el.attributes.has('id')).toBe(false)
  })

  it('updates event listeners without adding duplicate handlers', () => {
    const el = new FakeElement()
    const first = vi.fn()
    const second = vi.fn()

    patchProp(el, 'onClick', null, first)
    el.dispatch('click', { type: 'click' })

    patchProp(el, 'onClick', first, second)
    el.dispatch('click', { type: 'click' })

    expect(first).toHaveBeenCalledTimes(1)
    expect(second).toHaveBeenCalledTimes(1)
    expect(el.listeners.get('click')?.size).toBe(1)

    patchProp(el, 'onClick', second, null)
    el.dispatch('click', { type: 'click' })

    expect(second).toHaveBeenCalledTimes(1)
    expect(el.listeners.get('click')?.size).toBe(0)
    expect(el.attributes.has('onClick')).toBe(false)
  })
})
