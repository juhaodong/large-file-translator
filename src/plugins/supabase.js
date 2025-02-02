import {defineStore} from 'pinia'
import {loginUsingOTP, onAuthChange, sendOTPApi} from "@/dataLayer/cloudApi.js";


export const useUserStore = defineStore('user-store', () => {
  const currentUser = ref(null)
  const shouldShowLoginForm = ref(true)
  const formReady = ref(false)
  const currentCredit = ref(0)
  const showAddCredit = ref(false)
  onAuthChange(({event, token, userInfo}) => {
    currentUser.value = userInfo
    shouldShowLoginForm.value = token === null
  })

  function validateEmail(input) {
    console.log(input)
    return String(input)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      ) || '你输入的邮箱不对啊';
  }

  const loginFormLoading = ref(true)
  const emailInput = ref('')
  const otpSent = ref(false)
  const otpInput = ref('')


  const loading = ref(false)

  async function sendOTP() {
    loading.value = true
    const res = await sendOTPApi(emailInput.value)
    loading.value = false
    if (res) {
      otpSent.value = true
    }

  }

  async function login() {
    await loginUsingOTP(emailInput.value, otpInput.value)
  }

  function reset() {
    emailInput.value = ''
    otpInput.value = ''
    otpSent.value = false
  }


  return {
    currentUser,
    emailInput,
    validateEmail,
    sendOTP,
    showAddCredit,
    reset,
    formReady,
    otpSent,
    shouldShowLoginForm,
    loginFormLoading,
    loading,
    otpInput,
    login,
  }
})
