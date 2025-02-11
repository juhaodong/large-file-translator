<template>
  <v-app>
    <router-view/>
  </v-app>
</template>

<script setup>
//
</script>
<style>
::-webkit-scrollbar
{
  width: 8px;  /* for vertical scrollbars */
  height: 12px; /* for horizontal scrollbars */
}

::-webkit-scrollbar-track
{
  background: rgba(0, 0, 0, 0.1);
}

::-webkit-scrollbar-thumb
{
  background: rgba(255,255,255,0.5);
  border-radius: 8px;
}

</style>
