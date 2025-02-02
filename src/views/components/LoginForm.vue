<script setup>
import {useUserStore} from "@/plugins/supabase.js";

const userStore = useUserStore()
</script>

<template>
  <v-dialog v-model="userStore.shouldShowLoginForm" max-width="600">
    <v-card class="pa-6 d-flex flex-column justify-center align-center text-center" width="100%">
      <div class="text-h6">
        登录/注册
      </div>
      <template v-if="userStore.otpSent">
        <div class="text-caption mt-4">
          请输入刚刚我们发送到{{ userStore.emailInput }}的6位数字，请注意，有效期为60分钟。如果您不小心输入了错误的邮箱，请点击返回按钮。
        </div>
        <v-otp-input autofocus v-model="userStore.otpInput" @finish="userStore.login()"></v-otp-input>
        <v-btn @click="userStore.reset()" color="white">回到上一步</v-btn>
      </template>
      <template v-else>
        <div class="text-caption mt-2">
          你得有个账户才能使用，因为AI翻译要花钱成本太高了，我们暂时没有钱来让你免费试用。
        </div>
        <div style="width:100%">
          <v-form v-model="userStore.formReady">
            <v-text-field
              style="width: 100%"
              class="mt-2" :rules="[userStore.validateEmail]" validate-on="blur" v-model="userStore.emailInput"
            ></v-text-field>
          </v-form>
        </div>

        <v-btn
          block
          color="white" size="large" @click="userStore.sendOTP()" :disabled="!userStore.formReady"
          :loading="userStore.loading"
        >
          登录/注册
        </v-btn>
      </template>

    </v-card>
  </v-dialog>
</template>

<style scoped>

</style>
