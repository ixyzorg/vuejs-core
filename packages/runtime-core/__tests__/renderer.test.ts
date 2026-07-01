import { describe, expect, it } from 'vitest'
import { h } from '../src/h'
import { createRenderer } from '../src/renderer'

class HostElement {
  children: HostElement[] = []
  parent: HostElement | null = null
  props = new Map<string, unknown>()
  text = ''

  constructor(public type: string) {}
}

const createHostRenderer = () =>
  createRenderer({
    createElement: (type: string) => new HostElement(type),
    insert: (el: HostElement, parent: HostElement) => {
      parent.children.push(el)
      el.parent = parent
    },
    setElementText: (el: HostElement, text: string) => {
      el.text = text
    },
    remove: (el: HostElement) => {
      const parent = el.parent
      if (!parent) return

      const index = parent.children.indexOf(el)
      if (index > -1) {
        parent.children.splice(index, 1)
      }
      el.parent = null
    },
    createText: (text: string) => text,
    setText: () => {},
    parentNode: (el: HostElement) => el.parent,
    nextSibling: () => null,
    querySelector: () => null,
    patchProp: (
      el: HostElement,
      key: string,
      _prevValue: unknown,
      nextValue: unknown,
    ) => {
      el.props.set(key, nextValue)
    },
  })

describe('runtime-core renderer', () => {
  it('mounts an empty element into a container', () => {
    const { render } = createHostRenderer()
    const container = new HostElement('root')
    const vnode = h('main')

    render(vnode, container)

    expect(container.children).toHaveLength(1)
    expect(container.children[0]).toMatchObject({
      type: 'main',
      children: [],
      text: '',
    })
    expect(vnode.el).toBe(container.children[0])
  })

  it('mounts element props and text children', () => {
    const { render } = createHostRenderer()
    const container = new HostElement('root')
    const vnode = h('div', { id: 'app' }, 'hello')

    render(vnode, container)

    const el = container.children[0]
    expect(el.type).toBe('div')
    expect(el.props.get('id')).toBe('app')
    expect(el.text).toBe('hello')
    expect(vnode.el).toBe(el)
  })

  it('unmounts a previously mounted vnode tree', () => {
    const { render } = createHostRenderer()
    const container = new HostElement('root') as HostElement & {
      _vnode?: unknown
    }
    const vnode = h('div', { id: 'parent' }, [
      h('span', { id: 'first' }, 'one'),
      h('span', { id: 'second' }, 'two'),
    ])

    render(vnode, container)

    const root = container.children[0]
    const firstChild = root.children[0]
    const secondChild = root.children[1]
    expect(container._vnode).toBe(vnode)

    render(null, container)

    expect(container.children).toEqual([])
    expect(root.parent).toBe(null)
    expect(firstChild.parent).toBe(null)
    expect(secondChild.parent).toBe(null)
    expect(container._vnode).toBe(null)
  })
})
