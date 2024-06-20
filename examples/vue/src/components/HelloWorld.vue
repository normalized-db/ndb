<script setup lang="ts">
import { toRefs } from 'vue';

const props = defineProps<{ msg: string }>();
const { msg } = toRefs(props);
</script>

<template>
  <div class="text-xl">
    Hello, <span class="font-bold">{{ msg }}</span>!
  </div>
</template>
