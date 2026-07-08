export function hasPropsChanges(prevProps, nextProps) {
  const nextKeys = Object.keys(nextProps)
  if (nextKeys.length !== Object.keys(prevProps).length) {
    return true
  }
  for (const key of nextKeys) {
    if (nextProps[key] !== prevProps[key]) {
      return true
    }
  }
  return false
}
export function ShouldUpDateComponent(n1, n2) {
  const { props: prevProps, children: prevChildren } = n1
  const { props: nextProps, children: nextChildren } = n2

  //只要有插槽就需要更新
  if (prevChildren || nextChildren) {
    return true
  }

  if (!prevProps) {
    //老的没有 新的有
    //老的没有 新没有
    return !!nextProps
  }

  if (!nextProps) {
    //老的有 新的没有直接更新
    return true
  }

  return hasPropsChanges(prevProps, nextProps)
}
