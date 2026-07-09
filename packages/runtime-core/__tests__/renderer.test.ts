import { describe, expect, it } from 'vitest'
import { ref } from '@vue/reactivity'
import { h } from '../src/h'
import { createRenderer } from '../src/renderer'
import { Text, createVnode } from '../src/vnode'

type HostNode = HostElement | HostText

class HostElement {
  children: HostNode[] = []
  parent: HostElement | null = null
  props = new Map<string, unknown>()
  text = ''

  constructor(public type: string) {}
}

class HostText {
  parent: HostElement | null = null

  constructor(public text: string) {}
}

const createHostRenderer = (
  options: { onInsert?: (el: HostNode) => void } = {},
) =>
  createRenderer({
    createElement: (type: string) => new HostElement(type),
    insert: (el: HostNode, parent: HostElement, anchor?: HostNode) => {
      options.onInsert?.(el)
      const currentIndex = parent.children.indexOf(el)
      if (currentIndex > -1) {
        parent.children.splice(currentIndex, 1)
      }
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
    createText: (text: string) => new HostText(text),
    setText: (node: HostText, text: string) => {
      node.text = text
    },
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
  it('mounts a text node into a container', () => {
    const { render } = createHostRenderer()
    const container = new HostElement('root')
    const vnode = createVnode(Text, null, 'hello')

    render(vnode, container)

    expect(container.children).toHaveLength(1)
    expect(container.children[0]).toBeInstanceOf(HostText)
    expect(container.children[0]).toMatchObject({
      text: 'hello',
      parent: container,
    })
    expect(vnode.el).toBe(container.children[0])
  })

  it('updates a mounted text node without replacing it', () => {
    const { render } = createHostRenderer()
    const container = new HostElement('root')
    const prevVnode = createVnode(Text, null, 'hello')
    const nextVnode = createVnode(Text, null, 'world')

    render(prevVnode, container)

    const textNode = container.children[0]

    render(nextVnode, container)

    expect(container.children).toEqual([textNode])
    expect(textNode).toMatchObject({ text: 'world' })
    expect(nextVnode.el).toBe(textNode)
  })

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

  it("mounts h('div', ['hello', 'world']) as text node children", () => {
    const { render } = createHostRenderer()
    const container = new HostElement('root')
    const vnode = h('div', ['hello', 'world'])

    render(vnode, container)

    const el = container.children[0]
    expect(el).toBeInstanceOf(HostElement)
    expect(el.children).toHaveLength(2)
    expect(el.children[0]).toBeInstanceOf(HostText)
    expect(el.children[1]).toBeInstanceOf(HostText)
    expect(el.children.map((child) => child.text)).toEqual(['hello', 'world'])
  })

  it("mounts h('div', [1, 2]) as text node children", () => {
    const { render } = createHostRenderer()
    const container = new HostElement('root')
    const vnode = h('div', [1, 2])

    render(vnode, container)

    const el = container.children[0]
    expect(el).toBeInstanceOf(HostElement)
    expect(el.children).toHaveLength(2)
    expect(el.children[0]).toBeInstanceOf(HostText)
    expect(el.children[1]).toBeInstanceOf(HostText)
    expect(el.children.map((child) => child.text)).toEqual(['1', '2'])
  })

  it('updates primitive array children as text node children', () => {
    const { render } = createHostRenderer()
    const container = new HostElement('root')
    const prevVnode = h('div', ['hello', 1])
    const nextVnode = h('div', ['world', 2])

    render(prevVnode, container)

    const el = container.children[0]
    const firstText = el.children[0]
    const secondText = el.children[1]

    render(nextVnode, container)

    expect(el.children).toEqual([firstText, secondText])
    expect(el.children.map((child) => child.text)).toEqual(['world', '2'])
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

  it('reorders keyed children when the first new index is zero', () => {
    const { render } = createHostRenderer()
    const container = new HostElement('root')
    const prevVnode = h('div', { id: 'app' }, [
      h('p', { key: 'a' }, 'A'),
      h('p', { key: 'b' }, 'B'),
    ])
    const nextVnode = h('div', { id: 'app' }, [
      h('p', { key: 'b' }, 'B updated'),
      h('p', { key: 'a' }, 'A updated'),
    ])

    render(prevVnode, container)

    const root = container.children[0]
    const oldA = root.children[0]
    const oldB = root.children[1]

    render(nextVnode, container)

    expect(root.children.map((child) => child.text)).toEqual([
      'B updated',
      'A updated',
    ])
    expect(root.children[0]).toBe(oldB)
    expect(root.children[1]).toBe(oldA)
    expect(nextVnode.children[0].el).toBe(oldB)
    expect(nextVnode.children[1].el).toBe(oldA)
  })

  it('keeps children in the longest increasing subsequence in place during unordered diff', () => {
    const inserted: HostElement[] = []
    const { render } = createHostRenderer({
      onInsert: (el) => {
        inserted.push(el)
      },
    })
    const container = new HostElement('root')
    const prevVnode = h('div', { id: 'app' }, [
      h('p', { key: 'a' }, 'A'),
      h('p', { key: 'b' }, 'B'),
      h('p', { key: 'c' }, 'C'),
      h('p', { key: 'd' }, 'D'),
      h('p', { key: 'e' }, 'E'),
    ])
    const nextVnode = h('div', { id: 'app' }, [
      h('p', { key: 'a' }, 'A updated'),
      h('p', { key: 'c' }, 'C updated'),
      h('p', { key: 'd' }, 'D updated'),
      h('p', { key: 'b' }, 'B updated'),
      h('p', { key: 'e' }, 'E updated'),
    ])

    render(prevVnode, container)

    const root = container.children[0]
    const oldA = root.children[0]
    const oldB = root.children[1]
    const oldC = root.children[2]
    const oldD = root.children[3]
    const oldE = root.children[4]
    inserted.length = 0

    render(nextVnode, container)

    expect(root.children.map((child) => child.text)).toEqual([
      'A updated',
      'C updated',
      'D updated',
      'B updated',
      'E updated',
    ])
    expect(root.children[0]).toBe(oldA)
    expect(root.children[1]).toBe(oldC)
    expect(root.children[2]).toBe(oldD)
    expect(root.children[3]).toBe(oldB)
    expect(root.children[4]).toBe(oldE)
    expect(inserted).toEqual([oldB])
  })

  it('does not move existing keyed children when their new indexes are increasing', () => {
    const inserted: HostElement[] = []
    const { render } = createHostRenderer({
      onInsert: (el) => {
        inserted.push(el)
      },
    })
    const container = new HostElement('root')
    const prevVnode = h('div', { id: 'app' }, [
      h('p', { key: 'a' }, 'A'),
      h('p', { key: 'b' }, 'B'),
      h('p', { key: 'c' }, 'C'),
      h('p', { key: 'd' }, 'D'),
      h('p', { key: 'e' }, 'E'),
    ])
    const nextVnode = h('div', { id: 'app' }, [
      h('p', { key: 'a' }, 'A updated'),
      h('p', { key: 'c' }, 'C updated'),
      h('p', { key: 'd' }, 'D updated'),
      h('p', { key: 'f' }, 'F'),
      h('p', { key: 'e' }, 'E updated'),
    ])

    render(prevVnode, container)

    const root = container.children[0]
    const oldA = root.children[0]
    const oldB = root.children[1]
    const oldC = root.children[2]
    const oldD = root.children[3]
    const oldE = root.children[4]
    inserted.length = 0

    render(nextVnode, container)

    expect(root.children.map((child) => child.text)).toEqual([
      'A updated',
      'C updated',
      'D updated',
      'F',
      'E updated',
    ])
    expect(root.children[0]).toBe(oldA)
    expect(root.children[1]).toBe(oldC)
    expect(root.children[2]).toBe(oldD)
    expect(root.children[4]).toBe(oldE)
    expect(root.children[3]).not.toBe(oldA)
    expect(root.children[3]).not.toBe(oldB)
    expect(root.children[3]).not.toBe(oldC)
    expect(root.children[3]).not.toBe(oldD)
    expect(root.children[3]).not.toBe(oldE)
    expect(oldB.parent).toBe(null)
    expect(inserted).toEqual([root.children[3]])
  })

  it('mounts new keyed children during unordered diff', () => {
    const { render } = createHostRenderer()
    const container = new HostElement('root')
    const prevVnode = h('div', { id: 'app' }, [
      h('p', { key: 'a' }, 'A'),
      h('p', { key: 'b' }, 'B'),
      h('p', { key: 'c' }, 'C'),
      h('p', { key: 'e' }, 'E'),
    ])
    const nextVnode = h('div', { id: 'app' }, [
      h('p', { key: 'a' }, 'A updated'),
      h('p', { key: 'c' }, 'C updated'),
      h('p', { key: 'd' }, 'D'),
      h('p', { key: 'b' }, 'B updated'),
      h('p', { key: 'e' }, 'E updated'),
    ])

    render(prevVnode, container)

    const root = container.children[0]
    const oldA = root.children[0]
    const oldB = root.children[1]
    const oldC = root.children[2]
    const oldE = root.children[3]

    render(nextVnode, container)

    expect(root.children.map((child) => child.text)).toEqual([
      'A updated',
      'C updated',
      'D',
      'B updated',
      'E updated',
    ])
    expect(root.children[0]).toBe(oldA)
    expect(root.children[1]).toBe(oldC)
    expect(root.children[3]).toBe(oldB)
    expect(root.children[4]).toBe(oldE)
    expect(root.children[2]).not.toBe(oldA)
    expect(root.children[2]).not.toBe(oldB)
    expect(root.children[2]).not.toBe(oldC)
    expect(root.children[2]).not.toBe(oldE)
    expect(nextVnode.children[2].el).toBe(root.children[2])
  })

  it('unmounts removed keyed children during unordered diff', () => {
    const { render } = createHostRenderer()
    const container = new HostElement('root')
    const prevVnode = h('div', { id: 'app' }, [
      h('p', { key: 'a' }, 'A'),
      h('p', { key: 'b' }, 'B'),
      h('p', { key: 'c' }, 'C'),
      h('p', { key: 'd' }, 'D'),
      h('p', { key: 'e' }, 'E'),
    ])
    const nextVnode = h('div', { id: 'app' }, [
      h('p', { key: 'a' }, 'A updated'),
      h('p', { key: 'c' }, 'C updated'),
      h('p', { key: 'b' }, 'B updated'),
      h('p', { key: 'e' }, 'E updated'),
    ])

    render(prevVnode, container)

    const root = container.children[0]
    const oldA = root.children[0]
    const oldB = root.children[1]
    const oldC = root.children[2]
    const oldD = root.children[3]
    const oldE = root.children[4]

    render(nextVnode, container)

    expect(root.children.map((child) => child.text)).toEqual([
      'A updated',
      'C updated',
      'B updated',
      'E updated',
    ])
    expect(root.children[0]).toBe(oldA)
    expect(root.children[1]).toBe(oldC)
    expect(root.children[2]).toBe(oldB)
    expect(root.children[3]).toBe(oldE)
    expect(oldD.parent).toBe(null)
  })

  it('sets refs like a parent render function', () => {
    const { render } = createHostRenderer()
    const container = new HostElement('root')
    let elRef
    let childRef
    const Son = {
      setup(_props, { expose }) {
        const str = ref('son')
        const foo = () => 'Son expose foo'

        expose({ foo, str })

        return () => h('section', 'son')
      },
    }
    const Parent = {
      setup() {
        elRef = ref(null)
        childRef = ref(null)

        return () => h('div', { ref: elRef }, [h(Son, { ref: childRef })])
      },
    }

    render(h(Parent), container)

    expect(elRef.value.type).toBe('div')
    expect(childRef.value.foo()).toBe('Son expose foo')
    expect(childRef.value.str).toBe('son')
    expect(childRef.value.$el.type).toBe('section')
  })
})
