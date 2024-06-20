<script setup lang="ts">
import { toRefs } from 'vue';
import type { BlogPost } from '../utils/model.ts';
import BlogPostItem from './BlogPostItem.vue';

const props = defineProps<{ posts: BlogPost[] }>();
const { posts } = toRefs(props);
</script>

<template>
  <ul class="grid grid-cols-4 flex-wrap gap-2">
    <BlogPostItem
      v-for="post in posts"
      :key="post.id"
      :post="post"
    />
  </ul>
</template>
