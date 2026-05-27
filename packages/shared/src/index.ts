export const isArray = Array.isArray

export const isObject = (val: unknown): val is Object => {
  return val !== null && typeof val === 'object'
}

export const hasChanged = (val, newVal) => {
  return !Object.is(val, newVal)
}

export const isFn = (value: any): value is Function => {
  return typeof value === 'function'
}
