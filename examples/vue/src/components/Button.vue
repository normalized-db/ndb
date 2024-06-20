<script setup lang="ts">
import { toRefs } from 'vue';

const props = withDefaults(
  defineProps<{
    type?: 'button' | 'submit',
    icon?: boolean
    disabled?: boolean
  }>(),
  {
    type: 'button',
    icon: false,
    disabled: false,
  },
);
const { type, icon, disabled } = toRefs(props);

const emit = defineEmits<{
  click: [void],
}>();
</script>

<template>
  <button
    :type="type"
    :disabled="disabled"
    :class="['btn', icon && 'btn-icon']"
    @click="emit('click')"
  >
    <slot />
  </button>
</template>
