import { describe, expect, it } from 'vitest'
import { h } from '../src/h'
import { createVnode } from '../src/vnode'

describe('runtime-core h', () => {
  it("h('div')：只传入类型时创建没有 props 和 children 的 vnode", () => {
    const vnode = h('div')

    expect(vnode).toMatchObject({
      __v_isVNode: true,
      type: 'div',
      props: null,
      children: null,
      key: null,
      el: null,
    })
  })

  it("h('div', { id: 'app' })：传入 props 时创建带 props 的 vnode", () => {
    const vnode = h('div', { id: 'app' })

    expect(vnode).toMatchObject({
      type: 'div',
      props: { id: 'app' },
      children: null,
    })
  })

  it("h('div', 'hello')：第二个参数传入文本时创建文本子节点 vnode", () => {
    const vnode = h('div', 'hello')

    expect(vnode).toMatchObject({
      type: 'div',
      props: null,
      children: 'hello',
    })
  })

  it("h('div', [child])：第二个参数传入数组时创建数组子节点 vnode", () => {
    const child = h('span')
    const vnode = h('div', [child])

    expect(vnode).toMatchObject({
      type: 'div',
      props: null,
      children: [child],
    })
  })

  it("h('div', ['hello', 'world'])：保留数组中的文本 children", () => {
    const vnode = h('div', ['hello', 'world'])

    expect(vnode).toMatchObject({
      type: 'div',
      props: null,
      children: ['hello', 'world'],
    })
  })

  it("h('div', [1, 2])：保留数组中的数字 children", () => {
    const vnode = h('div', [1, 2])

    expect(vnode).toMatchObject({
      type: 'div',
      props: null,
      children: [1, 2],
    })
  })

  it('createVnode 会保留数组中的文本和数字 children', () => {
    const vnode = createVnode('div', null, ['hello', 1])

    expect(vnode).toMatchObject({
      type: 'div',
      children: ['hello', 1],
    })
  })

  it("h('div', child)：第二个参数传入 vnode 时会包装成数组子节点", () => {
    const child = h('span')
    const vnode = h('div', child)

    expect(vnode).toMatchObject({
      type: 'div',
      props: null,
      children: [child],
    })
  })

  it("h('div', { class: 'box' }, 'hello')：传入 props 和文本 children 时创建完整 vnode", () => {
    const vnode = h('div', { class: 'box' }, 'hello')

    expect(vnode).toMatchObject({
      type: 'div',
      props: { class: 'box' },
      children: 'hello',
    })
  })

  it("h('div', { id: 'app' }, child)：传入 props 和 vnode children 时会把 children 包装成数组", () => {
    const child = h('span')
    const vnode = h('div', { id: 'app' }, child)

    expect(vnode).toMatchObject({
      type: 'div',
      props: { id: 'app' },
      children: [child],
    })
  })

  it("h('div', { id: 'app' }, first, second)：传入多个 children 参数时创建数组子节点 vnode", () => {
    const first = h('span')
    const second = h('p')
    const vnode = h('div', { id: 'app' }, first, second)

    expect(vnode).toMatchObject({
      type: 'div',
      props: { id: 'app' },
      children: [first, second],
    })
  })
})
