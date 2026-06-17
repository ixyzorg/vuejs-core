export function patchProp(el, key, prevVal, nextVal) {
  if (key === 'class') {
    patchClass(el, nextVal)
  }
  if (key === 'style') {
    patchStyle(el, prevVal, nextVal)
  }

  if (/^on[A-Z]/.test(key)) {
    patchEvent(el, key, nextVal)
  }

  patchAttrs(el, key, nextVal)
}

function patchClass(el: HTMLElement, value) {
  if (value) {
    el.className = value
  } else {
    el.removeAttribute('class')
  }
}

function patchStyle(el, prevVal, nextVal) {
  const style = el.style
  if (nextVal) {
    for (const key in nextVal) {
      style[key] = nextVal[key]
    }
  }
  if (prevVal) {
    for (const key in prevVal) {
      if (!Reflect.has(nextVal, key)) {
        style[key] = null
      }
    }
  }
}

const veiKey: unique symbol = Symbol('_vei')
/**
 * const fn1 = ()=>{}
 * const fn2 = ()=>{}
 * click addEventListener('click',(e)=>{fn1(e)})
 * @param el
 * @param rawName
 * @param prevVal
 * @param nextVal
 */
function patchEvent(el, rawName: string, nextVal) {
  const name = rawName.slice(2).toLowerCase()
  const invokers = (el[veiKey] ??= {})

  const existingInvoker = invokers[rawName]
  if (nextVal) {
    if (existingInvoker) {
      existingInvoker.value = nextVal
      return
    }
    const invoker = createInvoker(nextVal)
    invokers[rawName] = invoker
    el.addEventListener(name, invoker)
  } else {
    if (existingInvoker) {
      el.removeEventListener(name, existingInvoker)
      invokers[rawName] = undefined
    }
  }
}

/*
const vNode1 = h(
  'div',
  {
    onClick: () => {
      console.log(1)
    }
  },
  'hello'
)
const vNode2 = h(
  'div',
  {
    onClick: () => {
      console.log(2)
    }
  },
  'hello'
)
 */
/**
 * 事件换绑
 * @param value
 * @returns
 */
function createInvoker(value) {
  const invoker = (e) => {
    invoker.value(e)
  }
  invoker.value = value
  return invoker
}

function patchAttrs<T>(el: HTMLElement, key, value) {
  if (value) {
    el.setAttribute(key, value)
  } else {
    el.removeAttribute(value)
  }
}
