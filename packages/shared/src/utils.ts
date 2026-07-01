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

export const isNull = (value) => {
  return value === null
}

export const isUndef = (value) => {
  return typeof value === undefined
}

export const isNullOrUndef = (value) => {
  return isNull(value) || isUndef(value)
}

export const isString = (value)=>{
  return typeof value === 'string'
}