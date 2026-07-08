import { describe, expect, it } from 'vitest'
import { h } from '../src/h'
import {
  onBeforeMount,
  onBeforeUnmount,
  onBeforeUpdate,
  onMounted,
  onUnmounted,
  onUpdated,
} from '../src/apiLiveCycle'
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

describe('runtime-core apiLiveCycle', () => {
  it('calls beforeMount before inserting the sub tree and mounted after', () => {
    const calls: string[] = []
    const { render } = createHostRenderer({
      onInsert: () => {
        calls.push('insert')
      },
    })
    const container = new HostElement('root')
    const Child = {
      setup() {
        onBeforeMount(() => {
          calls.push('beforeMount')
        })
        onMounted(() => {
          calls.push('mounted')
        })

        return () => {
          calls.push('render')
          return h('div', 'child')
        }
      },
    }

    render(h(Child), container)

    expect(calls).toEqual(['render', 'beforeMount', 'insert', 'mounted'])
  })

  it('calls beforeUpdate before patching and updated after props change', () => {
    const calls: string[] = []
    const { render } = createHostRenderer()
    const container = new HostElement('root')
    const Child = {
      props: ['msg'],
      setup() {
        onBeforeUpdate(() => {
          calls.push(`beforeUpdate:${container.children[0].text}`)
        })
        onUpdated(() => {
          calls.push(`updated:${container.children[0].text}`)
        })

        return {}
      },
      render() {
        return h('div', this.msg)
      },
    }

    render(h(Child, { msg: 'one' }), container)
    calls.length = 0

    render(h(Child, { msg: 'two' }), container)

    expect(calls).toEqual(['beforeUpdate:one', 'updated:two'])
  })

  it('calls beforeUnmount before removing the sub tree and unmounted after', () => {
    const calls: string[] = []
    const { render } = createHostRenderer()
    const container = new HostElement('root') as HostElement & {
      _vnode?: unknown
    }
    const Child = {
      setup() {
        onBeforeUnmount(() => {
          calls.push(`beforeUnmount:${container.children.length}`)
        })
        onUnmounted(() => {
          calls.push(`unmounted:${container.children.length}`)
        })

        return () => h('div', 'child')
      },
    }

    render(h(Child), container)
    calls.length = 0

    render(null, container)

    expect(calls).toEqual(['beforeUnmount:1', 'unmounted:0'])
    expect(container.children).toEqual([])
  })
})
