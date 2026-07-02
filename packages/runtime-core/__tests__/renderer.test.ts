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
    insert: (el: HostElement, parent: HostElement, anchor?: HostElement) => {
      const index = anchor ? parent.children.indexOf(anchor) : -1
      if (index > -1) {
        parent.children.splice(index, 0, el)
      } else {
        parent.children.push(el)
      }
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

  it('patches children from an array to text without unmounting the root element', () => {
    const { render } = createHostRenderer()
    const container = new HostElement('root')
    const prevVnode = h('div', { id: 'app' }, [
      h('h1', { id: 'title' }, 'hello'),
    ])
    const nextVnode = h('div', { id: 'app' }, 'world')

    render(prevVnode, container)

    const root = container.children[0]
    const oldChild = root.children[0]

    render(nextVnode, container)

    expect(container.children).toEqual([root])
    expect(nextVnode.el).toBe(root)
    expect(root.text).toBe('world')
    expect(root.children).toEqual([])
    expect(oldChild.parent).toBe(null)
  })

  it('patches children from text to different text on the reused root element', () => {
    const { render } = createHostRenderer()
    const container = new HostElement('root')
    const prevVnode = h('div', { id: 'app' }, 'hello')
    const nextVnode = h('div', { id: 'app' }, 'world')

    render(prevVnode, container)

    const root = container.children[0]

    render(nextVnode, container)

    expect(container.children).toEqual([root])
    expect(nextVnode.el).toBe(root)
    expect(root.text).toBe('world')
    expect(root.children).toEqual([])
  })

  it('patches children from text to an array on the reused root element', () => {
    const { render } = createHostRenderer()
    const container = new HostElement('root')
    const prevVnode = h('div', { id: 'app' }, 'hello')
    const nextVnode = h('div', { id: 'app' }, [
      h('span', { id: 'first' }, 'one'),
      h('span', { id: 'second' }, 'two'),
    ])

    render(prevVnode, container)

    const root = container.children[0]

    render(nextVnode, container)

    expect(container.children).toEqual([root])
    expect(nextVnode.el).toBe(root)
    expect(root.text).toBe('')
    expect(root.children).toHaveLength(2)
    expect(root.children[0]).toMatchObject({ type: 'span', text: 'one' })
    expect(root.children[1]).toMatchObject({ type: 'span', text: 'two' })
    expect(root.children[0].parent).toBe(root)
    expect(root.children[1].parent).toBe(root)
  })

  it('mounts new keyed children after a matching head sequence', () => {
    const { render } = createHostRenderer()
    const container = new HostElement('root')
    const prevVnode = h('div', { id: 'app' }, [
      h('p', { key: 'a' }, 'A'),
      h('p', { key: 'b' }, 'B'),
    ])
    const nextVnode = h('div', { id: 'app' }, [
      h('p', { key: 'a' }, 'A updated'),
      h('p', { key: 'b' }, 'B updated'),
      h('p', { key: 'c' }, 'C'),
      h('p', { key: 'd' }, 'D'),
    ])

    render(prevVnode, container)

    const root = container.children[0]
    const oldA = root.children[0]
    const oldB = root.children[1]

    render(nextVnode, container)

    expect(root.children.map((child) => child.text)).toEqual([
      'A updated',
      'B updated',
      'C',
      'D',
    ])
    expect(root.children[0]).toBe(oldA)
    expect(root.children[1]).toBe(oldB)
    expect(nextVnode.children[0].el).toBe(oldA)
    expect(nextVnode.children[1].el).toBe(oldB)
  })

  it('mounts new keyed children before a matching tail sequence', () => {
    const { render } = createHostRenderer()
    const container = new HostElement('root')
    const prevVnode = h('div', { id: 'app' }, [
      h('p', { key: 'a' }, 'A'),
      h('p', { key: 'b' }, 'B'),
    ])
    const nextVnode = h('div', { id: 'app' }, [
      h('p', { key: 'c' }, 'C'),
      h('p', { key: 'd' }, 'D'),
      h('p', { key: 'a' }, 'A updated'),
      h('p', { key: 'b' }, 'B updated'),
    ])

    render(prevVnode, container)

    const root = container.children[0]
    const oldA = root.children[0]
    const oldB = root.children[1]

    render(nextVnode, container)

    expect(root.children.map((child) => child.text)).toEqual([
      'C',
      'D',
      'A updated',
      'B updated',
    ])
    expect(root.children[2]).toBe(oldA)
    expect(root.children[3]).toBe(oldB)
    expect(nextVnode.children[2].el).toBe(oldA)
    expect(nextVnode.children[3].el).toBe(oldB)
  })

  it('unmounts old keyed children after a matching head sequence', () => {
    const { render } = createHostRenderer()
    const container = new HostElement('root')
    const prevVnode = h('div', { id: 'app' }, [
      h('p', { key: 'a' }, 'A'),
      h('p', { key: 'b' }, 'B'),
      h('p', { key: 'c' }, 'C'),
      h('p', { key: 'd' }, 'D'),
    ])
    const nextVnode = h('div', { id: 'app' }, [
      h('p', { key: 'a' }, 'A updated'),
      h('p', { key: 'b' }, 'B updated'),
    ])

    render(prevVnode, container)

    const root = container.children[0]
    const oldA = root.children[0]
    const oldB = root.children[1]
    const oldC = root.children[2]
    const oldD = root.children[3]

    render(nextVnode, container)

    expect(root.children.map((child) => child.text)).toEqual([
      'A updated',
      'B updated',
    ])
    expect(root.children[0]).toBe(oldA)
    expect(root.children[1]).toBe(oldB)
    expect(oldC.parent).toBe(null)
    expect(oldD.parent).toBe(null)
  })

  it('unmounts old keyed children before a matching tail sequence', () => {
    const { render } = createHostRenderer()
    const container = new HostElement('root')
    const prevVnode = h('div', { id: 'app' }, [
      h('p', { key: 'c' }, 'C'),
      h('p', { key: 'd' }, 'D'),
      h('p', { key: 'a' }, 'A'),
      h('p', { key: 'b' }, 'B'),
    ])
    const nextVnode = h('div', { id: 'app' }, [
      h('p', { key: 'a' }, 'A updated'),
      h('p', { key: 'b' }, 'B updated'),
    ])

    render(prevVnode, container)

    const root = container.children[0]
    const oldC = root.children[0]
    const oldD = root.children[1]
    const oldA = root.children[2]
    const oldB = root.children[3]

    render(nextVnode, container)

    expect(root.children.map((child) => child.text)).toEqual([
      'A updated',
      'B updated',
    ])
    expect(root.children[0]).toBe(oldA)
    expect(root.children[1]).toBe(oldB)
    expect(oldC.parent).toBe(null)
    expect(oldD.parent).toBe(null)
  })
})
