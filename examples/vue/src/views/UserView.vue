<script setup lang="ts">
import { ListResult } from '@normalized-db/data-store';
import { ref, toRefs, watchEffect } from 'vue';
import Alert from '../components/Alert.vue';
import BlogPostList from '../components/BlogPostList.vue';
import Button from '../components/Button.vue';
import { useBlogStore } from '../composables/blog-store.ts';
import { pluralize } from '../utils/format.ts';
import type { BlogPost, User } from '../utils/model.ts';

const { loading, findUser, findBlogPostsByUser, findCommentsCountByUser, addBlogPost } = useBlogStore();

const props = defineProps<{
  username: string,
}>();
const { username } = toRefs(props);

const user = ref<User | undefined>();
const posts = ref(new ListResult<BlogPost>());
const comments = ref(0);

watchEffect(async () => {
  user.value = await findUser(username.value);
  posts.value = await findBlogPostsByUser(username.value);
  comments.value = await findCommentsCountByUser(username.value);
});

function onSubmit() {
  addBlogPost(user.value);
}
</script>

<template>
  <template v-if="!loading">
    <h1>{{ user?.fullName ?? username }}</h1>
    <p class="text-sm">This user wrote {{ pluralize('post', posts.total) }} and {{ pluralize('comment', comments) }}.</p>
    <template v-if="user && posts.hasItems">
      <BlogPostList :posts="posts.items" />
      <Button @click="onSubmit">Submit new post</Button>
    </template>
    <template v-else-if="user">
      <Alert>{{ user.fullName }} has not posted anything yet.</Alert>
      <Button @click="onSubmit">Submit new post</Button>
    </template>
    <template v-else>
      <Alert>Could not find user</Alert>
    </template>
  </template>
</template>
