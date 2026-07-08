import { getCurrentInstance } from './component'

export enum ApiLiveCycle {
  //挂载
  BEFORE_MOUNT = 'bm',
  MOUNTED = 'm',
  // 更新
  BEFORE_UPDATE = 'bu',
  UPDATED = 'u',
  // 卸载
  BEFORE_UNMOUNT = 'bum',
  UNMOUNTED = 'um'
}

export const onBeforeMount = createHook(ApiLiveCycle.BEFORE_MOUNT)
export const onMounted = createHook(ApiLiveCycle.MOUNTED)

export const onBeforeUpdate = createHook(ApiLiveCycle.BEFORE_UPDATE)
export const onUpdated = createHook(ApiLiveCycle.UPDATED)

export const onBeforeUnmount = createHook(ApiLiveCycle.BEFORE_UNMOUNT)
export const onUnmounted = createHook(ApiLiveCycle.UNMOUNTED)

function createHook(type) {
  return (hook, target = getCurrentInstance()) => {
    injectHook(target, hook, type)
  }
}
/**
 *
 * @param target 组件实例
 * @param hook 用户的回掉
 * @param type 生命周期
 */
function injectHook(target, hook, type) {
  if (!target[type]) {
    target[type] = []
  }
  target[type].push(hook)
}

export function triggerHooks(instance, type) {
  const hooks = instance[type]
  if (hooks) {
    hooks.forEach((hook) => hook())
  }
}
