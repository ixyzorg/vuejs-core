import { beforeEach, describe, expect, it } from 'vitest'
import { nodeOpts } from '../src/nodeOpts'

class FakeNode {
  parentNode: FakeElement | null = null
  nextSibling: FakeNode | null = null
}

class FakeText extends FakeNode {
  constructor(public nodeValue: string) {
    super()
  }
}

class FakeElement extends FakeNode {
  childNodes: FakeNode[] = []
  textContent = ''

  constructor(public tagName: string) {
    super()
  }

  appendChild(node: FakeNode) {
    return this.insertBefore(node, null)
  }

  insertBefore(node: FakeNode, anchor: FakeNode | null) {
    const index = anchor ? this.childNodes.indexOf(anchor) : -1
    if (node.parentNode) {
      node.parentNode.removeChild(node)
    }
    node.parentNode = this
    if (index === -1) {
      this.childNodes.push(node)
    } else {
      this.childNodes.splice(index, 0, node)
    }
    this.syncSiblings()
    return node
  }

  removeChild(node: FakeNode) {
    const index = this.childNodes.indexOf(node)
    if (index > -1) {
      this.childNodes.splice(index, 1)
      node.parentNode = null
      node.nextSibling = null
      this.syncSiblings()
    }
    return node
  }

  private syncSiblings() {
    this.childNodes.forEach((child, index) => {
      child.nextSibling = this.childNodes[index + 1] ?? null
    })
  }
}

const roots = new Map<string, FakeElement>()

beforeEach(() => {
  roots.clear()
  ;(globalThis as any).document = {
    createElement: (type: string) => new FakeElement(type),
    createTextNode: (text: string) => new FakeText(text),
    querySelector: (selector: string) => roots.get(selector) ?? null,
  }
})

describe('runtime-dom nodeOpts', () => {
  it('creates elements and text nodes', () => {
    const div = nodeOpts.createElement('div') as unknown as FakeElement
    const text = nodeOpts.createText('hello') as unknown as FakeText

    expect(div.tagName).toBe('div')
    expect(text.nodeValue).toBe('hello')
  })

  it('inserts before an anchor and removes nodes', () => {
    const parent = new FakeElement('div')
    const first = new FakeElement('span')
    const second = new FakeElement('span')
    const inserted = new FakeElement('p')

    nodeOpts.insert(first as any, parent, null)
    nodeOpts.insert(second as any, parent, null)
    nodeOpts.insert(inserted as any, parent, second)

    expect(parent.childNodes).toEqual([first, inserted, second])
    expect(nodeOpts.parentNode(inserted)).toBe(parent)
    expect(nodeOpts.nextSibling(inserted)).toBe(second)

    nodeOpts.remove(inserted)

    expect(parent.childNodes).toEqual([first, second])
    expect(nodeOpts.parentNode(inserted)).toBe(null)
  })

  it('sets element and text content', () => {
    const el = new FakeElement('div')
    const text = new FakeText('before')

    nodeOpts.setElementText(el, 'after')
    nodeOpts.setText(text, 'done')

    expect(el.textContent).toBe('after')
    expect(text.nodeValue).toBe('done')
  })

  it('queries elements from document', () => {
    const app = new FakeElement('div')
    roots.set('#app', app)

    expect(nodeOpts.querySelector('#app')).toBe(app)
    expect(nodeOpts.querySelector('#missing')).toBe(null)
  })
})
