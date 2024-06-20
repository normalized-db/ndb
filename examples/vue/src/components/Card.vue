<script setup lang="ts">
import { useSlots } from 'vue';

const slots = useSlots();
</script>

<template>
  <div class="bg-brand-100 border border-brand-200 rounded-lg">
    <header v-if="slots.header" class="px-4 py-2 font-bold border-b border-brand-200">
      <slot name="header" />
    </header>
    <div class="p-4 flex flex-col gap-4">
      <slot />
    </div>
  </div>
</template>
