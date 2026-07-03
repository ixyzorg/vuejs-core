//最长递增子序列
// [1,5,3,4,7,8]

/* 
  [1]
  [1,5]
  [1,3]
  [1,3,4]
  [1,3,4,7]
  [1,3,4,7,8]
*/

//[10,3,5,9,12,8,15,18]
/* 
[10]
[3]
[3,5]
[3,5,9]
[3,5,9,12]
[3,5,8,12]
[3,5,8,12,15]
[3,5,8,12,15,18]
反向追溯
[3,5,9,12,15,18]
*/

function getSequence(arr) {
  const result = [] // result 存索引
  const map = new Map() // key: 当前索引，value: 前驱索引
  
  for (let i = 0; i < arr.length; i++) {
    const item = arr[i]

    if (result.length === 0) {
      result.push(i)
      continue
    }

    const lastIndex = result[result.length - 1]
    const lastItem = arr[lastIndex]
    // 当前值比最后一个大，直接追加
    if (item > lastItem) {
      map.set(i, lastIndex)
      result.push(i)
      continue
    }

    // 二分：找第一个 >= item 的位置
    let left = 0
    let right = result.length - 1
    while (left < right) {
      const mid = Math.floor((left + right) / 2)
      const midItem = arr[result[mid]]
      if (midItem < item) {
        left = mid + 1
      } else {
        right = mid
      }
    }
    // 替换
    if (item < arr[result[left]]) {
      if (left > 0) {
        map.set(i, result[left - 1])
      }
      result[left] = i
    }
  }

  // 反向追溯
  let last = result[result.length - 1]
  const sequence = []
  while (last !== undefined) {
    sequence.unshift(last)
    last = map.get(last)
  }

  return sequence
}