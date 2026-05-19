import { describe, expect, it } from 'vitest'
import { isArray } from '../src/index'

describe('@vue/shared', () => {
  it('checks array values', () => {
    expect(isArray([])).toBe(true)
    expect(isArray({})).toBe(false)
  })
})
