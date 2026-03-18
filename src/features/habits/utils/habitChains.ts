// Habit Chains Visualization Component
export interface ChainLink {
  date: string
  completed: boolean
  value?: number
}

export const calculateChain = (entries: Array<{ date: string; value: number }>, days = 30): ChainLink[] => {
  const chain: ChainLink[] = []
  const today = new Date()
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000)
    const dateString = date.toISOString().split('T')[0]
    const entry = entries.find(e => e.date === dateString)
    
    chain.push({
      date: dateString,
      completed: entry ? entry.value > 0 : false,
      value: entry?.value,
    })
  }
  
  return chain
}

export const getCurrentChainLength = (chain: ChainLink[]): number => {
  let length = 0
  for (let i = chain.length - 1; i >= 0; i--) {
    if (chain[i].completed) {
      length++
    } else if (i !== chain.length - 1) {
      break
    }
  }
  return length
}

export const getLongestChain = (entries: Array<{ date: string; value: number }>): number => {
  let longest = 0
  let current = 0
  
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date))
  
  for (const entry of sorted) {
    if (entry.value > 0) {
      current++
      longest = Math.max(longest, current)
    } else {
      current = 0
    }
  }
  
  return longest
}
