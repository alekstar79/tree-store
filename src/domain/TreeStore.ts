export type TreeItemId = string | number;

export interface TreeItemBase {
  id: TreeItemId;
  parent: TreeItemId | null;
}

/**
 * Хранилище дерева.
 *
 * Индексы:
 * - byId — точечный доступ к элементу;
 * - parentById — подъём к корню;
 * - childrenByParentId — дети в порядке вставки;
 * - indexById — замена элемента в getAll() без поиска по массиву.
 *
 * Чтения после setItems/add/remove/update не сканируют исходный массив.
 */
export class TreeStore<T extends TreeItemBase> {
  private items: T[]
  private readonly byId = new Map<TreeItemId, T>()
  private readonly parentById = new Map<TreeItemId, TreeItemId | null>()
  private readonly childrenByParentId = new Map<
    TreeItemId | null,
    Map<TreeItemId, T>
  >()
  private readonly indexById = new Map<TreeItemId, number>()

  constructor(items: readonly T[] = []) {
    this.items = []
    this.setItems(items)
  }

  /**
   * Возвращает полный массив элементов в исходном порядке.
   * Возвращается внутренний массив: не мутируйте его снаружи.
   */
  getAll(): T[] {
    return this.items
  }

  getItem(id: TreeItemId): T | undefined {
    return this.byId.get(id)
  }

  getChildren(id: TreeItemId): T[] {
    const children = this.childrenByParentId.get(id)
    return children ? Array.from(children.values()) : []
  }

  /**
   * Все потомки в DFS pre-order, без самого элемента.
   * Порядок детей — порядок вставки.
   */
  getAllChildren(id: TreeItemId): T[] {
    const result: T[] = []

    const rootChildren = this.childrenByParentId.get(id)
    if (!rootChildren) {
      return result
    }

    const stack: T[] = []
    const pushChildren = (children: Map<TreeItemId, T>): void => {
      const values = Array.from(children.values())
      for (let i = values.length - 1; i >= 0; i -= 1) {
        stack.push(values[i])
      }
    }

    pushChildren(rootChildren)

    const seen = new Set<TreeItemId>()

    while (stack.length > 0) {
      const item = stack.pop()!
      if (seen.has(item.id)) {
        continue
      }

      seen.add(item.id)
      result.push(item)

      const children = this.childrenByParentId.get(item.id)
      if (children) {
        pushChildren(children)
      }
    }

    return result
  }

  /**
   * Цепочка от самого элемента до корня: [self, parent, ..., root].
   */
  getAllParents(id: TreeItemId): T[] {
    const result: T[] = []
    const seen = new Set<TreeItemId>()
    let currentId: TreeItemId | null | undefined = id

    while (currentId !== null && currentId !== undefined) {
      if (seen.has(currentId)) {
        break
      }

      seen.add(currentId)

      const item = this.byId.get(currentId)
      if (!item) {
        break
      }

      result.push(item)

      const parentId = this.parentById.get(currentId)
      if (parentId === undefined) {
        break
      }

      currentId = parentId
    }

    return result
  }

  /**
   * Полная замена данных. Индексы строятся за один проход.
   */
  setItems(items: readonly T[]): void {
    this.items = Array.from(items)
    this.byId.clear()
    this.parentById.clear()
    this.childrenByParentId.clear()
    this.indexById.clear()

    for (let index = 0; index < this.items.length; index += 1) {
      const item = this.items[index]

      this.byId.set(item.id, item)
      this.parentById.set(item.id, item.parent)
      this.indexById.set(item.id, index)

      this.addToChildrenMap(item.parent, item)
    }
  }

  addItem(item: T): void {
    if (this.byId.has(item.id)) {
      this.updateItem(item)
      return
    }

    const index = this.items.length
    this.items.push(item)

    this.byId.set(item.id, item)
    this.parentById.set(item.id, item.parent)
    this.indexById.set(item.id, index)

    this.addToChildrenMap(item.parent, item)
  }

  /**
   * Удаляет элемент и всё его поддерево.
   * Коллекция items перестраивается одним filter-проходом.
   */
  removeItem(id: TreeItemId): void {
    if (!this.byId.has(id)) {
      return
    }

    const idsToRemove = new Set<TreeItemId>()
    const stack: TreeItemId[] = [id]

    while (stack.length > 0) {
      const currentId = stack.pop()!
      if (idsToRemove.has(currentId)) {
        continue
      }

      const item = this.byId.get(currentId)
      if (!item) {
        continue
      }

      idsToRemove.add(currentId)

      const children = this.childrenByParentId.get(currentId)
      if (children) {
        for (const child of children.values()) {
          stack.push(child.id)
        }
      }
    }

    for (const currentId of idsToRemove) {
      const parentId = this.parentById.get(currentId)
      if (parentId !== undefined) {
        const siblings = this.childrenByParentId.get(parentId)
        if (siblings) {
          siblings.delete(currentId)
          if (siblings.size === 0) {
            this.childrenByParentId.delete(parentId)
          }
        }
      }

      this.byId.delete(currentId)
      this.parentById.delete(currentId)
      this.childrenByParentId.delete(currentId)
    }

    this.items = this.items.filter((item) => !idsToRemove.has(item.id))
    this.rebuildIndex()
  }

  /**
   * Обновляет элемент по id.
   * При смене parent элемент переносится в конец списка детей нового родителя.
   * Циклы не создаются: невалидная смена parent игнорируется, остальные поля обновляются.
   */
  updateItem(item: T): void {
    const existing = this.byId.get(item.id)
    if (!existing) {
      return
    }

    const oldParentId = existing.parent
    let updatedItem = item

    if (
      item.parent !== oldParentId &&
      this.isDescendantOrSelf(item.id, item.parent)
    ) {
      updatedItem = { ...item, parent: oldParentId } as T
    }

    const newParentId = updatedItem.parent
    const parentChanged = oldParentId !== newParentId

    if (parentChanged) {
      const oldSiblings = this.childrenByParentId.get(oldParentId)
      if (oldSiblings) {
        oldSiblings.delete(updatedItem.id)
        if (oldSiblings.size === 0) {
          this.childrenByParentId.delete(oldParentId)
        }
      }

      this.addToChildrenMap(newParentId, updatedItem)
    } else {
      const siblings = this.childrenByParentId.get(newParentId)
      if (siblings) {
        siblings.set(updatedItem.id, updatedItem)
      } else {
        this.addToChildrenMap(newParentId, updatedItem)
      }
    }

    this.byId.set(updatedItem.id, updatedItem)
    this.parentById.set(updatedItem.id, updatedItem.parent)

    const index = this.indexById.get(updatedItem.id)
    if (index !== undefined) {
      this.items[index] = updatedItem
    } else {
      this.items.push(updatedItem)
      this.indexById.set(updatedItem.id, this.items.length - 1)
    }
  }

  private addToChildrenMap(parentId: TreeItemId | null, item: T): void {
    let children = this.childrenByParentId.get(parentId)
    if (!children) {
      children = new Map<TreeItemId, T>()
      this.childrenByParentId.set(parentId, children)
    }

    children.set(item.id, item)
  }

  private rebuildIndex(): void {
    this.indexById.clear()

    for (let index = 0; index < this.items.length; index += 1) {
      this.indexById.set(this.items[index].id, index)
    }
  }

  private isDescendantOrSelf(
    ancestorId: TreeItemId,
    nodeId: TreeItemId | null,
  ): boolean {
    if (nodeId === null) {
      return false
    }

    let currentId: TreeItemId | null = nodeId
    const seen = new Set<TreeItemId>()

    while (currentId !== null) {
      if (currentId === ancestorId) {
        return true
      }

      if (seen.has(currentId)) {
        return false
      }

      seen.add(currentId)

      const parentId = this.parentById.get(currentId)
      if (parentId === undefined) {
        return false
      }

      currentId = parentId
    }

    return false
  }
}
