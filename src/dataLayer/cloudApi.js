import hillo from "hillo";

// const cloudUrl = "https://cloud-v2.aaden.io/";
const cloudUrl = "http://localhost/";

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
 * 获取用户的所有项目
 * @param {string} userId - 用户 ID
 * @returns {Promise<any>} - 用户的项目列表
 */
export async function getUserProjects(userId) {
  try {
    const response = await hillo.get(`${cloudUrl}api/projects/user/${userId}`);
    return response; // 假设响应中直接包含项目列表
  } catch (error) {
    console.error("获取用户项目失败：", error);
    throw new Error("无法获取用户项目");
  }
}

/**
 * 创建新项目
 * @param {object} projectData - 创建项目的请求数据，包括 userId, fileUrl 和 sourceLanguage
 * @returns {Promise<any>} - 返回创建的项目详情
 */
export async function createProject(projectData) {
  try {
    const response = await hillo.jsonPost(`${cloudUrl}api/projects/create`, projectData);
    return response; // 假设响应内容是新创建项目的详细信息
  } catch (error) {
    console.error("创建项目失败：", error);
    throw new Error("无法创建项目，请检查请求数据");
  }
}

/**
 * 获取项目详情
 * @param {number} projectId - 项目 ID
 * @returns {Promise<any>} - 项目详情数据
 */
export async function getProjectDetails(projectId) {
  try {
    const response = await hillo.get(`${cloudUrl}api/projects/${projectId}/details`);
    return response; // 假设响应内容是项目的详情数据
  } catch (error) {
    console.error("获取项目详情失败：", error);
    throw new Error("无法获取项目详情");
  }
}

/**
 * 上传文件并创建项目
 * @param {File} file - 要上传的文件
 * @param {string} userId - 用户 ID
 * @param {string} sourceLanguage - 文件的语言 (可选, 默认 'eng')
 * @returns {Promise<any>} - 返回创建的项目详情
 */
export async function uploadAndCreateProject(file, userId, sourceLanguage = 'eng') {
  try {
    // 上传文件
    const uploadResult = await uploadFile(file);
    if (!uploadResult) {
      throw new Error("文件上传失败");
    }

    // 创建项目
    return await createProject({
      userId,
      fileUrl: uploadResult,
      sourceLanguage
    });
  } catch (error) {
    console.error("文件上传或项目创建失败：", error);
    throw new Error("无法上传文件并创建项目");
  }
}


export async function uploadFile(file) {
  return await hillo.postWithUploadFile(cloudUrl + 'uploadFile', {file})
}

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
