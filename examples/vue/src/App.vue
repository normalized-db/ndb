<script setup lang="ts">
</script>

<template>
  <div class="min-h-svh max-w-screen-lg mx-auto flex flex-col gap-16">
    <header class="p-4 text-center">
      <nav>
        <ul>
          <li>
            <RouterLink :to="{ name: 'blog' }" class="nav-link" active-class="nav-link-active">Blog</RouterLink>
          </li>
        </ul>
      </nav>
    </header>
    <main class="p-4 flex flex-col gap-8 items-center">
      <RouterView />
    </main>
  </div>
</template>
