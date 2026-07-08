import { describe, expect, it } from 'vitest'
import { h } from '../src/h'
import { createRenderer } from '../src/renderer'

type HostNode = HostElement | HostText

class HostElement {
  children: HostNode[] = []
  parent: HostElement | null = null
  text = ''

  constructor(public type: string) {}
}

class HostText {
  parent: HostElement | null = null

  constructor(public text: string) {}
}

const createHostRenderer = () =>
  createRenderer({
    createElement: (type: string) => new HostElement(type),
    insert: (el: HostNode, parent: HostElement) => {
      parent.children.push(el)
      el.parent = parent
    },
    setElementText: (el: HostElement, text: string) => {
      el.text = text
    },
    remove: (el: HostNode) => {
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
    parentNode: (el: HostNode) => el.parent,
    nextSibling: () => null,
    querySelector: () => null,
    patchProp: () => {},
  })

describe('runtime-core component slots', () => {
  it('渲染默认插槽内容', () => {
    const { render } = createHostRenderer()
    const container = new HostElement('root')
    const Child = {
      setup() {
        return {}
      },
      render() {
        return h('main', [this.$slots.default()])
      },
    }
    const Parent = {
      setup() {
        return {}
      },
      render() {
        return h(Child, null, {
          default: () => h('span', 'default slot'),
        })
      },
    }

    render(h(Parent), container)

    const main = container.children[0] as HostElement
    const slot = main.children[0] as HostElement
    expect(slot.type).toBe('span')
    expect(slot.text).toBe('default slot')
  })

  it('渲染作用域插槽内容', () => {
    const { render } = createHostRenderer()
    const container = new HostElement('root')
    const Child = {
      setup() {
        return {}
      },
      render() {
        return h('section', [
          this.$slots.default({
            msg: 'from child',
          }),
        ])
      },
    }
    const Parent = {
      setup() {
        return {}
      },
      render() {
        return h(Child, null, {
          default: ({ msg }) => h('p', `scoped ${msg}`),
        })
      },
    }

    render(h(Parent), container)

    const section = container.children[0] as HostElement
    const slot = section.children[0] as HostElement
    expect(slot.type).toBe('p')
    expect(slot.text).toBe('scoped from child')
  })

  it('渲染具名插槽内容', () => {
    const { render } = createHostRenderer()
    const container = new HostElement('root')
    const Child = {
      setup() {
        return {}
      },
      render() {
        return h('article', [
          this.$slots.header(),
          this.$slots.footer(),
        ])
      },
    }
    const Parent = {
      setup() {
        return {}
      },
      render() {
        return h(Child, null, {
          header: () => h('h1', 'named header'),
          footer: () => h('footer', 'named footer'),
        })
      },
    }

    render(h(Parent), container)

    const article = container.children[0] as HostElement
    const header = article.children[0] as HostElement
    const footer = article.children[1] as HostElement
    expect(header.type).toBe('h1')
    expect(header.text).toBe('named header')
    expect(footer.type).toBe('footer')
    expect(footer.text).toBe('named footer')
  })
})
