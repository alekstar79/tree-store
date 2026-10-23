export type ItemId = string | number;

export interface Item {
  id: ItemId;
  parent: ItemId | null;
  label?: string;
  [key: string]: unknown;
}

export interface GridRow extends Item {
  path: string[];
  category: 'Группа' | 'Элемент';
}