import {nodeOpts} from './nodeOpts'
import {patchProp} from './patchProp'

export * from '@vue/runtime-core'
export const renderOptions = {...nodeOpts,patchProp}
