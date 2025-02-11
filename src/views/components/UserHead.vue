<script setup>
import {useUserStore} from "@/plugins/supabase.js";
import {useDisplay} from "vuetify";

const userStore = useUserStore()
const {lgAndUp} = useDisplay()
</script>

<template>
  <v-card
    flat
    color="#f6f6f6"
    class="pa-3 px-8 mb-8 elevation-0 d-flex flex-shrink-0 align-center"
    rounded="lg"
    v-if="userStore.currentUser"
  >
    PDF翻译大王👑
    <v-spacer></v-spacer>
    <div v-if="lgAndUp" class="text-caption mr-4">
      {{ userStore.currentUser.email }}
    </div>
    <v-btn
      @click="userStore.showAddCredit=true"
      color="black"
      flat
      rounded="lg"
      prepend-icon="mdi-wallet"
    >
      {{ userStore.currentCredit }}
    </v-btn>

  </v-card>
</template>

<style scoped>

</style>
