<script setup lang="ts">
import BlogPostList from '../components/BlogPostList.vue';
import Button from '../components/Button.vue';
import { useBlogStore } from '../composables/blog-store.ts';

const { loading, posts, addBlogPost } = useBlogStore();
</script>

<template>
  <h1>Demo Blog</h1>
  <template v-if="!loading">
    <BlogPostList :posts="posts" />
    <Button @click="addBlogPost">Submit new post</Button>
  </template>
</template>
