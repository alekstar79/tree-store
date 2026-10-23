<script setup lang="ts">
import { ref } from 'vue'
import { AgGridVue } from 'ag-grid-vue3'
import type {
  ColDef,
  GridApi,
  GridReadyEvent,
  ICellRendererParams,
  GetRowIdParams,
} from 'ag-grid-community'
import type { GridRow } from '../types'

interface Props {
  rows: GridRow[];
  loading: boolean;
}

defineProps<Props>()

const gridApi = ref<GridApi<GridRow> | null>(null)

const defaultColDef: ColDef<GridRow> = {
  resizable: true,
  sortable: true
}

// Обычные колонки
const columnDefs: ColDef<GridRow>[] = [
  {
    headerName: '№ п/п',
    colId: 'rowNumber',
    width: 110,
    sortable: false,
    filter: false,
    valueGetter: (params) => (params.node?.rowIndex ?? -1) + 1
  },
  {
    headerName: 'Наименование',
    field: 'label',
    minWidth: 260,
    flex: 1
  }
]

// Колонка дерева (Auto Group Column)
const autoGroupColumnDef: ColDef<GridRow> = {
  headerName: 'Категория',
  width: 280,
  minWidth: 280,
  cellRendererParams: {
    suppressCount: true,
    innerRenderer: (params: ICellRendererParams<GridRow>) => {
      return params.data?.category || ''
    }
  }
}

const getDataPath = (data: GridRow): string[] => data.path
const getRowId = (params: GetRowIdParams<GridRow>): string => String(params.data.id)

const onGridReady = (params: GridReadyEvent<GridRow>): void => {
  gridApi.value = params.api
  // Перемещаем колонку дерева на второе место (индекс 1)
  params.api.moveColumns(['ag-Grid-AutoColumn'], 1)
}
</script>

<template>
  <div class="grid-wrapper ag-theme-alpine">
    <AgGridVue
      class="ag-grid"
      :loading="loading"
      :column-defs="columnDefs"
      :auto-group-column-def="autoGroupColumnDef"
      :default-col-def="defaultColDef"
      :row-data="rows"
      :tree-data="true"
      :get-data-path="getDataPath"
      :group-default-expanded="-1"
      :suppress-group-rows-sticky="true"
      :get-row-id="getRowId"
      @grid-ready="onGridReady"
    />
  </div>
</template>

<style scoped>
.grid-wrapper {
  width: 100%;
  height: 100%;
  min-height: 400px;
}
.ag-grid {
  width: 100%;
  height: 100%;
}
</style>
