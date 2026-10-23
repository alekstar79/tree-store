import { onMounted, ref, shallowRef } from 'vue'
import { TreeStore } from '../domain/TreeStore'
import type { GridRow, Item } from '../types'

const DATA_URL = `${import.meta.env.BASE_URL}items.json`
const LOADING_DELAY_MS = 2000

function toPathKey(id: Item['id']): string {
  return typeof id === 'number' ? `n:${id}` : `s:${id}`
}

function buildGridRow(store: TreeStore<Item>, item: Item): GridRow {
  const path = store
    .getAllParents(item.id)
    .reverse()
    .map((node) => toPathKey(node.id))

  const category = store.getChildren(item.id).length > 0 ? 'Группа' : 'Элемент'

  return {
    ...item,
    path,
    category
  }
}

export function useTreeGrid() {
  const store = new TreeStore<Item>([]);
  const rows = shallowRef<GridRow[]>([]);
  const loading = ref(true);

  const refreshRows = (): void => {
    rows.value = store
      .getAll()
      .map((item) => buildGridRow(store, item))
  }

  onMounted(async () => {
    loading.value = true

    await new Promise((resolve) => setTimeout(resolve, LOADING_DELAY_MS))

    const response = await fetch(DATA_URL)
    const items = (await response.json()) as Item[]

    store.setItems(items)
    refreshRows()
    loading.value = false
  })

  return {
    store,
    rows,
    loading,
    refreshRows
  }
}
