<script setup lang="ts">
import ChatInterface from './components/ChatInterface.vue'
</script>

<template>
  <div class="app">
    <ChatInterface />
  </div>
</template>

<style>
html, body {
  height: 100%;
  margin: 0;
  padding: 0;
  background-color: #F9FAFB;
}

#app {
  height: 100vh;
  display: flex;
  flex-direction: column;
  max-width: 1280px;
  margin: 0 auto;
  padding: 0;
  text-align: left;
}

.app {
  height: 100%;
  display: flex;
  flex-direction: column;
  flex: 1;
}

body {
  color: #213547;
  background-color: #F9FAFB;
}
</style>
