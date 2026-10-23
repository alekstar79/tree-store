import { describe, expect, it } from 'vitest'
import { TreeStore } from '../src/domain/TreeStore'

interface TestItem {
  id: number | string;
  parent: number | string | null;
  label: string;
}

const items: TestItem[] = [
  { id: 1, parent: null, label: 'Айтем 1' },
  { id: '91064cef', parent: 1, label: 'Айтем 2' },
  { id: 3, parent: 1, label: 'Айтем 3' },
  { id: 4, parent: '91064cef', label: 'Айтем 4' },
  { id: 5, parent: '91064cef', label: 'Айтем 5' },
  { id: 6, parent: '91064cef', label: 'Айтем 6' },
  { id: 7, parent: 4, label: 'Айтем 7' },
  { id: 8, parent: 4, label: 'Айтем 8' },
]

describe('TreeStore', () => {
  it('getAll возвращает полный массив', () => {
    const store = new TreeStore(items)
    expect(store.getAll()).toHaveLength(items.length)
  })

  it('getItem возвращает элемент по id', () => {
    const store = new TreeStore(items)
    expect(store.getItem('91064cef')?.label).toBe('Айтем 2')
  })

  it('getChildren возвращает прямых детей в порядке вставки', () => {
    const store = new TreeStore(items)
    expect(store.getChildren('91064cef').map((item) => item.id)).toEqual([
      4, 5, 6,
    ])
    expect(store.getChildren(1).map((item) => item.id)).toEqual([
      '91064cef',
      3
    ])
  })

  it('getChildren для листа и отсутствующего id возвращает []', () => {
    const store = new TreeStore(items)
    expect(store.getChildren(7)).toEqual([])
    expect(store.getChildren('missing')).toEqual([])
  })

  it('getAllChildren возвращает всех потомков в DFS pre-order', () => {
    const store = new TreeStore(items)
    expect(store.getAllChildren(1).map((item) => item.id)).toEqual([
      '91064cef',
      4,
      7,
      8,
      5,
      6,
      3,
    ])
  })

  it('getAllParents возвращает цепочку от элемента до корня', () => {
    const store = new TreeStore(items);
    expect(store.getAllParents(7).map((item) => item.id)).toEqual([
      7,
      4,
      '91064cef',
      1,
    ])
  })

  it('getAllParents для отсутствующего id возвращает []', () => {
    const store = new TreeStore(items)
    expect(store.getAllParents('missing')).toEqual([])
  })

  it('setItems полностью заменяет данные', () => {
    const store = new TreeStore(items)
    store.setItems([{ id: 10, parent: null, label: 'Новый' }])

    expect(store.getAll()).toHaveLength(1)
    expect(store.getItem(10)?.label).toBe('Новый')
    expect(store.getItem(1)).toBeUndefined()
  })

  it('addItem добавляет элемент и обновляет индексы', () => {
    const store = new TreeStore(items)
    store.addItem({ id: 9, parent: 4, label: 'Айтем 9' })

    expect(store.getItem(9)?.label).toBe('Айтем 9')
    expect(store.getChildren(4).map((item) => item.id)).toEqual([7, 8, 9])
    expect(store.getAll()).toHaveLength(9)
  })

  it('removeItem удаляет элемент и всё поддерево', () => {
    const store = new TreeStore(items)
    store.removeItem('91064cef')

    expect(store.getItem('91064cef')).toBeUndefined()
    expect(store.getItem(4)).toBeUndefined()
    expect(store.getItem(7)).toBeUndefined()
    expect(store.getAll().map((item) => item.id)).toEqual([1, 3])
    expect(store.getChildren(1).map((item) => item.id)).toEqual([3])
  })

  it('updateItem обновляет поля без смены parent', () => {
    const store = new TreeStore(items)
    store.updateItem({ id: 7, parent: 4, label: 'Айтем 7 обновлён' })

    expect(store.getItem(7)?.label).toBe('Айтем 7 обновлён')
    expect(store.getChildren(4).map((item) => item.id)).toEqual([7, 8])
  })

  it('updateItem переносит элемент при смене parent', () => {
    const store = new TreeStore(items)
    store.updateItem({ id: 3, parent: 4, label: 'Айтем 3' })

    expect(store.getChildren(1).map((item) => item.id)).toEqual(['91064cef'])
    expect(store.getChildren(4).map((item) => item.id)).toEqual([7, 8, 3])
    expect(store.getAllParents(3).map((item) => item.id)).toEqual([
      3,
      4,
      '91064cef',
      1
    ])
  })

  it('updateItem для отсутствующего id — no-op', () => {
    const store = new TreeStore(items)
    store.updateItem({ id: 'missing', parent: null, label: 'Нет' })
    expect(store.getAll()).toHaveLength(items.length)
  })

  it('removeItem для отсутствующего id — no-op', () => {
    const store = new TreeStore(items)
    store.removeItem('missing')
    expect(store.getAll()).toHaveLength(items.length)
  })
})
