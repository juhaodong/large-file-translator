import OpenAI from "openai";

// 初始化 OpenAI 配置
const apiKey = ""; // 替换为您的 OpenAI API 密钥


export async function doTranslation(str, apiKey) {
  try {
    const openai = new OpenAI({apiKey,dangerouslyAllowBrowser:true});
    // 调用 OpenAI 翻译 API
    const completion = await openai.chat.completions.create({
      messages: [{
        role: "system",
        content: "你是一个专业的翻译助手，需要将用户提供的内容精准翻译成中文。翻译时请确保语言流畅、准确且专业，保留原文的完整意义。对于学术性内容，请使用正式、严谨的表达方式；对于通俗内容，保持简洁易懂。只需返回翻译后的纯文本内容，无需包含任何多余说明、注释或格式修饰。所有翻译结果必须符合中文语法和表达习惯。"
      }, {
        role: "user",
        content: str
      }],

      model: "gpt-4o",
      store: true,
    });

    // 提取返回的翻译文本
    return completion.choices[0].message.content.trim();
  } catch (error) {
    console.error("翻译错误：", error);
    return str; // 出现错误时返回原始内容
  }
}
