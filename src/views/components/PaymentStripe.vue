<template>
  <v-dialog v-model="userStore.showAddCredit" max-width="600">
    <v-card
      color="white"
      :class="lgAndUp?'px-12':'px-4 py-4'"
      class="py-4 d-flex align-center flex-column justify-center"
      rounded="xl" style="" min-height="200"
    >
      <template v-if="loading">
        <v-progress-circular indeterminate></v-progress-circular>
      </template>
      <template v-else>
        <div style="width: 100%">
          <div class="text-body-2 text-center">
            购买页数？
          </div>
          <div class="mt-4" style="width: 100%;display: grid;grid-gap: 16px">
            <v-card
              @click="doPayment(p.id)"
              rounded="xl"
              color="grey-lighten-3"
              class="pa-4 px-6 d-flex" width="100%"
              flat :key="p.id" v-for="p in availablePriceIds"
            >
              <div class="text-body-1 font-weight-black">
                {{ p.pageCount }}页
              </div>
              <v-spacer></v-spacer>
              <div>
                {{ p.price }}€(~￥{{ (p.price * 7.8).toFixed(2) }})
              </div>
            </v-card>
          </div>

        </div>
        <div class="text-body-2 my-4">或者</div>
        <v-btn
          @click="showRecommendDialog=true"
          flat
          rounded="lg"
          color="#5FA8FF"
          prepend-icon="mdi-share"
        >推荐给你的朋友，免费获取积分
        </v-btn>
      </template>

    </v-card>

  </v-dialog>
  <v-dialog v-model="showRecommendDialog" max-width="600">
    <v-card rounded="xl" class="pa-4 py-6 d-flex flex-column">
      <div class="text-h6">您的积分用光了？没有关系!</div>
      <div class="text-body-2 mt-2">
        将下面的链接分享给你的朋友，如果你的朋友使用该链接注册并且购买了积分，您也将获得其购买积分10%的积分奖励。
      </div>
      <v-card
        v-if="userStore.currentUser"
        @click="copyRefLink"
        flat color="grey-lighten-3"
        class="text-body-2 pa-4 mt-4 d-flex align-center"
      >
        https://fanyidawang.io?ref={{ userStore.currentUser.id }}
        <v-spacer></v-spacer>
        <template v-if="showOk">
          <v-icon color="success-darken-2">mdi-check</v-icon>
          复制成功
        </template>
        <v-icon v-else>mdi-content-copy</v-icon>

      </v-card>
      <qrcode-vue v-if="userStore.currentUser" class="mt-4" :size="188" :value="getRefLink()"></qrcode-vue>
    </v-card>
  </v-dialog>

</template>

<script setup>
import {useUserStore} from "@/plugins/supabase.js";
import {generatePaymentUrl} from "@/dataLayer/cloudApi.js";
import {useDisplay} from "vuetify";
import QrcodeVue from "qrcode.vue";
import {ref} from "vue";

const showRecommendDialog = ref(false)
const showOk = ref(false)
const {lgAndUp} = useDisplay()
const availablePriceIds = ref([{
  id: 'price_1QrxR3EJRuEVURG7NrfqCRkP',
  price: 1,
  pageCount: 100
}, {
  id: 'price_1QrxUoEJRuEVURG7q4peTJvr',
  price: 3.99,
  pageCount: 500
}])
const userStore = useUserStore()
const loading = ref(false)

function getRefLink() {
  return "https://fanyidawang.io?ref=" + userStore.currentUser.id
}

function copyRefLink() {
  try {
    navigator.clipboard.writeText(getRefLink());
  } catch (e) {

  }
  showOk.value = true
  setTimeout(() => {
    showOk.value = false
  }, 1000)

}


async function doPayment(priceId) {
  loading.value = true
  try {
    if (userStore.currentUser != null) {
      const session = await generatePaymentUrl(priceId, userStore.currentUser.id)
      console.log(session)
      location.href = session.url
    }
  } catch (e) {

  }
  loading.value = false


}
</script>
