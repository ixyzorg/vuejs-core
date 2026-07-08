import { describe, expect, it, vi } from 'vitest'
import { h } from '../src/h'
import { createRenderer } from '../src/renderer'

class HostElement {
  children: HostElement[] = []
  parent: HostElement | null = null
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
    createText: (text: string) => {
      const node = new HostElement('text')
      node.text = text
      return node
    },
    setText: (node: HostElement, text: string) => {
      node.text = text
    },
    parentNode: (el: HostElement) => el.parent,
    nextSibling: () => null,
    querySelector: () => null,
    patchProp: () => {},
  })

describe('runtime-core component emit', () => {
  it('子组件 emit 能触发父组件传入的方法', () => {
    const { render } = createHostRenderer()
    const container = new HostElement('root')
    const onChange = vi.fn()
    const Child = {
      setup(_props, { emit }) {
        emit('change', 'hello', 1)

        return () => h('div', 'child')
      },
    }

    render(h(Child, { onChange }), container)

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith('hello', 1)
  })

  it('子组件 this.$emit 能触发父组件传入的方法', () => {
    const { render } = createHostRenderer()
    const container = new HostElement('root')
    const onSubmit = vi.fn()
    const Child = {
      setup() {
        return {}
      },
      render() {
        this.$emit('submit', 'ok')

        return h('button', 'submit')
      },
    }

    render(h(Child, { onSubmit }), container)

    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit).toHaveBeenCalledWith('ok')
  })
})
