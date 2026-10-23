import { defineComponent } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useTreeGrid } from '../src/composables/useTreeGrid'
import type { Item } from '../src/types'

const items: Item[] = [
  { id: 1, parent: null, label: 'Айтем 1' },
  { id: 2, parent: 1, label: 'Айтем 2' }
]

const Host = defineComponent({
  setup() {
    const { rows, loading } = useTreeGrid()
    return { rows, loading }
  },
  template: `
    <div>
      <span data-test="loading">{{ loading }}</span>
      <span data-test="count">{{ rows.length }}</span>
      <span data-test="first">{{ rows[0]?.label }}</span>
    </div>
  `
})

describe('useTreeGrid', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: async () => items
      })
    )
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('загружает данные с задержкой 2 секунды и реактивно обновляет строки', async () => {
    const wrapper = mount(Host)

    expect(wrapper.get('[data-test="loading"]').text()).toBe('true')
    expect(wrapper.get('[data-test="count"]').text()).toBe('0')

    await vi.advanceTimersByTimeAsync(1_999)
    expect(wrapper.get('[data-test="count"]').text()).toBe('0')

    await vi.advanceTimersByTimeAsync(1)
    await flushPromises()

    expect(wrapper.get('[data-test="loading"]').text()).toBe('false')
    expect(wrapper.get('[data-test="count"]').text()).toBe('2')
    expect(wrapper.get('[data-test="first"]').text()).toBe('Айтем 1')
  })
})
