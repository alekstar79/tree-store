import { describe, expect, it } from 'vitest'
import { TreeStore } from '../src/domain/TreeStore'

interface PerfItem {
  id: number;
  parent: number | null;
  label: string;
}

function buildItems(count: number): PerfItem[] {
  const items: PerfItem[] = [];
  for (let i = 0; i < count; i += 1) {
    items.push({
      id: i,
      parent: i === 0 ? null : Math.floor((i - 1) / 10), // Ветвление: по 10 детей на узел
      label: `Item ${i}`
    })
  }
  return items
}

describe('TreeStore performance', () => {
  it('строит индексы и выполняет чтения на большом дереве', () => {
    const items = buildItems(50_000)

    // 1. Замер построения индексов
    const buildStart = performance.now()
    const store = new TreeStore(items)
    const buildTime = performance.now() - buildStart

    // 2. Замер чтения (2000 запросов к Map)
    const readStart = performance.now()
    for (let i = 0; i < 2_000; i += 1) {
      const id = i % items.length
      store.getItem(id)
      store.getChildren(id)
    }
    const readTime = performance.now() - readStart

    console.log(`\n⏱️ Метрики производительности (50 000 элементов):`)
    console.log(`- Построение индексов (setItems): ${buildTime.toFixed(2)} ms`)
    console.log(`- 2000 операций чтения: ${readTime.toFixed(2)} ms\n`)

    expect(store.getAll()).toHaveLength(items.length)

    // Ожидаемое время: build ~10-15ms, read ~1-2ms.
    // Лимиты в 100ms и 20ms дают 6-10-кратный запас на слабое железо
    // и гарантированно отсекают O(N^2) или O(N^3) алгоритмы.
    expect(buildTime).toBeLessThan(100)
    expect(readTime).toBeLessThan(20)
  })
})
