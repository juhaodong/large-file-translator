import hillo from "hillo";

const cloudUrl = "https://cloud-v2.aaden.io/";

let extraHook = null;

// 默认的通用钩子函数，用于处理登录和登出事件
const touchPoint = async (event) => {
  if (event.type === "login") {
    // 登录时保存 token 到 localStorage
    localStorage.setItem("token", event.token);
  } else if (event.type === "logout") {
    // 登出时清除 token
    localStorage.removeItem("token");
  }
  if (event.token) {
    event.userInfo = await getUserInfoByToken(event.token);
  }

  // 调用额外的钩子函数，若存在的话
  extraHook && extraHook(event);
};

/**
 * 注入通用钩子函数，用于监听登录和登出逻辑
 * @param {function} authEventHook - 接收 { type: "login" | "logout", token, userInfo } 格式的事件
 */
export function onAuthChange(authEventHook) {
  if (typeof authEventHook === "function") {
    extraHook = authEventHook;
  }
}


export function getCredit(uid) {
  return hillo.get(cloudUrl + "user-credit/" + uid + "/balance");
}

export async function translate(text, userId) {
  return await hillo.jsonPost(cloudUrl + "translation/translate", {
    text, userId
  })

}

/**
 * 使用OTP登录
 * @param {string} email - 用户邮箱地址
 * @param {string} otp - OTP验证码
 * @returns {Promise<any>} - 包含用户信息和 token 的响应
 */
export async function loginUsingOTP(email, otp) {
  const payload = {email, otp};
  const response = await hillo.jsonPost(cloudUrl + "user/loginUsingOTP", payload);

  // 后端返回的响应中 token 必须存在
  if (response && response.tokenValue) {
    const token = response.tokenValue;

    // 调用登录钩子，将事件和完整的用户信息传递
    await touchPoint({type: "login", token});

    return true
  }

  throw new Error("登录失败，服务器未返回有效的 token");
}

/**
 * 退出登录
 * @returns {Promise<any>} - 请求结果
 */
export async function logout() {
  const token = localStorage.getItem("token");

  const response = await hillo.jsonPost(cloudUrl + "user/logout/" + token, {});

  // 调用登出钩子，传递事件
  await touchPoint({type: "logout", token: null});

  return response;
}

/**
 * 发送OTP到指定邮箱
 * @param {string} email - 用户邮箱地址
 * @returns {Promise<boolean>} - 是否发送成功
 */
export async function sendOTPApi(email) {
  try {
    await hillo.jsonPost(cloudUrl + "user/sendOTP/" + email, {email: email});
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
}

/**
 * 获取用户信息
 * @param {string} token - 用户登录令牌
 * @returns {Promise<any>} - 返回用户信息
 */
export async function getUserInfoByToken(token) {
  try {
    return await hillo.get(cloudUrl + "user/info/" + token);
  } catch (error) {
    console.error("获取用户信息失败：", error);
    throw new Error("获取用户信息失败");
  }
}

async function init() {
  const token = localStorage.getItem("token");
  console.log(token)
  if (token) {
    try {
      const userInfo = await getUserInfoByToken(token);
      console.log(userInfo)
      if (userInfo) {
        await touchPoint({type: "login", token, userInfo});
      }
    } catch (e) {
      console.log('auto login failed, token outdated or network error')
    }

  }
}

init()
