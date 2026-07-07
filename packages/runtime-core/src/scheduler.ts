export function queueJob(job) {
  return Promise.resolve().then(() => {
    job()
  })
}

export function nextTick(fn) {
  return Promise.resolve().then(() => fn.call(this))
}