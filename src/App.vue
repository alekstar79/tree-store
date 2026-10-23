<script setup lang="ts">
import TreeGrid from './components/TreeGrid.vue';
import { useTreeGrid } from './composables/useTreeGrid';

const { rows, loading } = useTreeGrid();
</script>

<template>
  <main class="app">
    <h1 class="app__title">Дерево элементов</h1>
    <TreeGrid :rows="rows" :loading="loading" />
  </main>
</template>