<template>
  <div class="flex h-screen">
    <!-- 聊天列表侧边栏 -->
    <SidebarView />
    
    <!-- 主内容区域 -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <HeaderView />
      <router-view />
    </div>
  </div>
</template>

<script setup lang="ts">
import SidebarView from './components/layout/SidebarView.vue';
import HeaderView from './components/layout/HeaderView.vue';
</script> 