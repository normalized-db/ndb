import { createRouter, createWebHistory } from 'vue-router';
import BlogView from './BlogView.vue';
import UserView from './UserView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/blog',
    },
    {
      path: '/blog',
      name: 'blog',
      component: BlogView,
    },
    {
      path: '/user/:username',
      name: 'user',
      component: UserView,
      props: true,
    },
  ],
});

export default router;
