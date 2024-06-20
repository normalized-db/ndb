import { ORDER_ASC } from '@normalized-db/data-store';
import { ref } from 'vue';
import { Arrays } from '../utils/arrays.ts';
import { createDataStore } from '../utils/idb-data-store.ts';
import { MathAddon } from '../utils/math.ts';
import type { BlogComment, BlogPost, User } from '../utils/model.ts';

function buildUser(id: number): User {
  return { userName: `user${id}`, fullName: `User #${id}` };
}

function buildBlogPost(id: number, author: () => User, commentAuthor: () => User = author): BlogPost {
  return {
    id: `post${id}`,
    title: `Post #${id}`,
    description: `Lorem ipsum ${id}`,
    createdBy: author(),
    comments: Arrays.factory(MathAddon.randomInt(0, 4), commentId => ({
      id: `p${id}-c${commentId}`,
      text: `Comment #${commentId}`,
      createdBy: commentAuthor(),
    })),
  };
}

const dataStore = createDataStore();

export function useBlogStore() {

  const loading = ref(true);
  const users = ref<User[]>([]);
  const posts = ref<BlogPost[]>([]);

  async function init(): Promise<void> {
    const prevUsers = await dataStore.find<User>('user')
      .orderBy({ userName: ORDER_ASC })
      .depth(0)
      .result();

    if (prevUsers.isEmpty) {
      users.value = Arrays.factory(3, buildUser);
      posts.value = Arrays.factory(4, id => buildBlogPost(id, () => Arrays.getRandom(users.value)));
      await dataStore.put('blogPost', posts.value);
    } else {
      const prevBlogPosts = await dataStore.find<BlogPost>('blogPost')
        .orderBy({ title: ORDER_ASC })
        .depth(1)
        .result();

      users.value = prevUsers.items;
      posts.value = prevBlogPosts.items;
    }

    loading.value = false;
  }

  void init();

  async function findUser(userName: string) {
    return dataStore.findByKey<User>('user', userName).result();
  }

  async function findBlogPostsByUser(userName: string) {
    // const user = await dataStore.findByKey<User>('user', userName).result();
    // return dataStore.find<BlogPost>('blogPost').reverse(user).result();
    return dataStore.find<BlogPost>('blogPost')
      .filter(post => (post.createdBy as any) === userName)
      .result();
  }

  async function findCommentsCountByUser(userName: string) {
    const user = await dataStore.findByKey<User>('user', userName).result();
    return dataStore.find<BlogComment>('comment').reverse(user).count();
    // return dataStore.find<BlogPost>('comment')
    //   .filter(comment => (comment.createdBy as any) === userName)
    //   .result();
  }

  async function addBlogPost(user?: User) {
    const post = buildBlogPost(
      posts.value.length + 2,
      () => user ?? Arrays.getRandom(users.value),
      () => Arrays.getRandom(users.value),
    );
    posts.value.push(post);

    await dataStore.put('blogPost', post);
  }

  return {
    loading,
    users,
    posts,
    findUser,
    findBlogPostsByUser,
    addBlogPost,
    findCommentsCountByUser,
  };
}
