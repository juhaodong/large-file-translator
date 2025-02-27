import {defineStore} from 'pinia'
import {loginUsingOTP, sendOTPApi} from "@/dataLayer/cloudApi.js";
import {LocalSettingManager} from "biewangle";
import {v4 as uuidv4} from 'uuid';

export const useUserStore = defineStore('user-store', () => {

  if (!Remember.currentUUID) {
    Remember.currentUUID = uuidv4()
  }
  const currentUser = ref({id: Remember.currentUUID})
  const shouldShowLoginForm = ref(false)
  const formReady = ref(false)
  const currentCredit = ref(0)
  const showAddCredit = ref(false)
  const otpError = ref(null)


  function validateEmail(input) {
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
    try {
      otpSent.value = await sendOTPApi(emailInput.value)

    } catch (e) {

    }

    loading.value = false

  }

  async function login() {
    try {
      loading.value = true
      await loginUsingOTP(emailInput.value, otpInput.value)
    } catch (e) {
      otpError.value = "haveError"
      otpInput.value = ''
    }
    loading.value = false

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
    currentCredit,
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
    otpError,
  }
})


export const Remember = LocalSettingManager.config({
  currentFileHash: "",
  currentUUID: "",
  emailConfirmed: false
})


export function formatFileSize(file) {
  const fileSizeInBytes = file.size; // 从 File 对象获取文件大小（字节）
  const units = ["B", "KB", "MB", "GB", "TB"];
  let index = 0;
  let fileSize = fileSizeInBytes;

  // 循环将大小单位从 B 转换为更大的单位，直到 < 1024
  while (fileSize >= 1024 && index < units.length - 1) {
    fileSize /= 1024;
    index++;
  }

  // 格式化为两位小数，并添加单位
  return `${fileSize.toFixed(2)} ${units[index]}`;
}

export function calculateUploadTime(file, uploadSpeed = 500 * 1024) {
  // 上传速度默认为 500 KB/s (要转换为字节：500 * 1024)
  const fileSizeInBytes = file.size; // 获取文件大小 (字节)

  // 计算耗时，单位为秒
  const timeInSeconds = fileSizeInBytes / uploadSpeed;

  // 转换为友好的格式：分钟和秒
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = Math.ceil(timeInSeconds % 60);

  if (minutes > 0) {
    return `${minutes} 分 ${seconds} 秒`;
  } else {
    return `${seconds} 秒`;
  }
}
