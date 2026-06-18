export function patchProp(el, key, prevVal, nextVal) {
  if (key === 'class') {
    patchClass(el, nextVal)
  } else if (key === 'style') {
    patchStyle(el, prevVal, nextVal)
  } else if (/^on[A-Z]/.test(key)) {
    patchEvent(el, key, nextVal)
  } else {
    patchAttrs(el, key, nextVal)
  }
}

function patchClass(el: HTMLElement, value) {
  if (value == null) {
    el.removeAttribute('class')
  } else {
    el.className = value
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
      if (!nextVal || !Reflect.has(nextVal, key)) {
        style[key] = ''
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

function patchAttrs(el: HTMLElement, key, value) {
  if (value) {
    el.setAttribute(key, value)
  } else {
    el.removeAttribute(key)
  }
}
