import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import TreeGrid from '../src/components/TreeGrid.vue'
import type { GridRow } from '../src/types'

vi.mock('ag-grid-vue3', () => ({
  AgGridVue: defineComponent({
    name: 'AgGridVue',
    props: [
      'rowData',
      'columnDefs',
      'autoGroupColumnDef',
      'treeData',
      'getDataPath',
      'groupDefaultExpanded',
      'defaultColDef',
    ],
    template: '<div data-test="ag-grid-stub">{{ rowData.length }}</div>'
  })
}))

const rows: GridRow[] = [
  {
    id: 1,
    parent: null,
    label: 'Айтем 1',
    path: ['n:1'],
    category: 'Группа'
  }
]

describe('TreeGrid', () => {
  it('передаёт строки в AG Grid', () => {
    const wrapper = mount(TreeGrid, {
      props: {
        rows,
        loading: false
      }
    })

    expect(wrapper.get('[data-test="ag-grid-stub"]').text()).toBe('1')
    expect(
      wrapper.findComponent({ name: 'AgGridVue' }).props('rowData')
    ).toEqual(rows)
  })
})
