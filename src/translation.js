import {translate} from "@/dataLayer/cloudApi.js";


export async function doTranslation(str, userId) {
  try {
    if (str.length < 6) {
      return str
    }

    const completion = await translate(str, userId)
    // 提取返回的翻译文本
    return completion.trim();
  } catch (error) {
    console.error("翻译错误：", error);
    return str; // 出现错误时返回原始内容
  }
}
