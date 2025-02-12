<script setup>
import redNote from '@/assets/rednote.png'
import {useInfoDisplayStore} from "@/plugins/stores/infoDisplayStore.js";

const infoStore = useInfoDisplayStore()

</script>

<template>
  <div class="mt-8 d-flex align-center" @click="infoStore.showExtraInfo=true">
    <div class="text-body-2 text-grey">
      翻译大王.io@copyright 2025
    </div>
    <v-spacer></v-spacer>
    <v-icon class="mr-2">
      mdi-information-outline
    </v-icon>
    <v-icon>
      mdi-github
    </v-icon>
    <v-img rounded class="flex-grow-0 ml-2" width="24" :src="redNote"></v-img>

  </div>
  <v-dialog v-model="infoStore.showExtraInfo" max-width="600px">
    <v-card class="pa-4 text-body-2">
      <div class="text-h6">社交媒体和说明</div>
      <div class="text-body-2 my-8">
        您好，我是@我在德国写代码,欢迎您使用翻译大王。请注意，本工具只用于翻译，翻译内容产生于ChatGPT等LLM模型。如果在使用中碰到任何问题，欢迎您在小红书上向我反馈。
      </div>
      <v-card
        target="_blank"
        href="https://github.com/juhaodong/large-file-translator" flat color="grey-lighten-3"
        class="pa-4 mt-2 d-flex align-center"
      >
        <v-icon class="mr-2">
          mdi-github
        </v-icon>
        GitHub
      </v-card>
      <v-card
        target="_blank"
        href="https://www.xiaohongshu.com/user/profile/5fdf012800000000010002d7" flat color="grey-lighten-3"
        class="pa-4 mt-2 d-flex align-center"
      >
        <v-img rounded class="flex-grow-0 mr-2" width="24" :src="redNote"></v-img>
        我在德国写代码
      </v-card>
    </v-card>
  </v-dialog>
</template>

<style scoped>

</style>
