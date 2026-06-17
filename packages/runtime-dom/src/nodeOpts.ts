export const nodeOpts = {
  insert(el:HTMLElement, parent, anchor) {
    parent.appendChild(el, anchor || null)
  },
  createElement(type) {
    return document.createElement(type)
  },
  setElementText(el, text) {
    el.textContent = text
  },
  remove(el) {
    const parentNode = el.parentNode
    parentNode?.removeChild(el)
  },
  createText(text) {
    return document.createTextNode(text)
  },
  setText(node, text) {
    return (node.nodeValue = text)
  },
  parentNode(el) {
    return el.parentNode
  },
  nextSibling(el) {
    return el.nextSibling
  },
  querySelector(selector) {
    return document.querySelector(selector)
  },
}
