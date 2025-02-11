<script setup>
import {useUserStore} from "@/plugins/supabase.js";
import {useDisplay} from "vuetify";
import logo from "@/assets/logo.png"
const userStore = useUserStore()

const {lgAndUp} = useDisplay()
</script>

<template>
  <v-card
    flat
    color="transparent"
    class="py-3 px-0 mb-8 elevation-0 d-flex flex-shrink-0 align-center"
    rounded="lg"
    v-if="userStore.currentUser"
  >
    <v-img width="200" class="flex-grow-0" :src="logo"></v-img>
    <v-spacer></v-spacer>
    <v-btn
      @click="userStore.showAddCredit=true"
      flat
      size="large"
      rounded="lg"
      variant="outlined"
      prepend-icon="mdi-wallet"
    >
      {{ userStore.currentCredit.toFixed(2) }}
    </v-btn>

  </v-card>
</template>

<style scoped>

</style>
