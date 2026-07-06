import { isArray } from '@vue/shared'
import { reactive } from '@vue/reactivity'

export function normalizeProps(props = {}) {
  if (isArray(props)) {
    return props.reduce((prev, cur) => {
      prev[cur] = {}
      return prev
    }, {})
  }
  return props
}

export function initProps(instance) {
  const { vnode } = instance
  const rawProps = vnode.props
  const props = {}
  const attrs = {}
  setFullProps(instance, rawProps, props, attrs)
  instance.props = reactive(props)
  instance.attrs = attrs
}

function setFullProps(instance, rawProps, props, attrs) {
  const propsOptions = instance.propsOptions
  if (rawProps) {
    for (const k in rawProps) {
      const value = rawProps[k]
      if (Object.hasOwn(propsOptions, k)) {
        props[k] = value
      } else {
        attrs[k] = value
      }
    }
  }
}
