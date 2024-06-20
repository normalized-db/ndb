<script setup lang="ts">
import { toRefs } from 'vue';
import { pluralize } from '../utils/format.ts';
import type { BlogPost } from '../utils/model.ts';
import Badge from './Badge.vue';
import Card from './Card.vue';

const props = defineProps<{ post: BlogPost }>();
const { post } = toRefs(props);
</script>

<template>
  <Card :id="post.id" :title="post.title">
    <template #header>
      <div class="flex justify-between items-center gap-8">
        <span>{{ post.title }}</span>
        <RouterLink :to="{ name: 'user', params: { username: post.createdBy.userName } }">
          <Badge :title="post.createdBy.userName">{{ post.createdBy.fullName }}</Badge>
        </RouterLink>
      </div>
    </template>
    {{ post.description }}
    <p class="text-sm">{{ pluralize('Comment', post.comments.length) }}</p>
  </Card>
</template>
