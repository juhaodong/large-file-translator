<template>
  <div class="fill-height">
    <div style="display: grid;grid-template-columns: 1fr 1fr">
      <div>
        <div class="bg-white" style="height: 100vh;overflow-y:scroll ">
          <template v-if="displayParagraph.length===0">
            <div class="text-h4  d-flex flex-column align-center justify-center" style="min-height: 100%">
              <div class="text-h4">
                ⌛
              </div>
              <div class="text-h6">
                正在等待你来翻译
              </div>
            </div>
          </template>
          <div class="pa-4" ref="pdfDoc" v-else>
            <div
              class="bg-grey-lighten-3 pa-6"
              style="min-height: 100%;width: 100%"
            >
              <div
                v-for="p in displayParagraph" class="mt-8" :style="{fontSize: p.fontSize*1.2 + 'px'}" style="width: 100%"
              >
                <div :style="{fontSize:p.fontSize+'px'}">{{ p.content }}</div>
                <v-progress-linear indeterminate v-if="p.translating" style="width: 100%"></v-progress-linear>
                <div>{{ p.translate }}</div>
              </div>
            </div>
          </div>

        </div>
      </div>

      <div style="width: 100%" class="pa-8">
        <div class="text-h1 mb-8">
          翻译大王👑
        </div>
        <div class="text-h4 mb-8">
          好用又便宜（免费试用版）
        </div>
        <v-text-field :disabled="isProcessing" v-model="apiKey" label="输入你的api key"></v-text-field>
        <v-file-input
          :disabled="isProcessing" prepend-icon="" append-inner-icon="mdi-file" v-model="file" label="选择 PDF 文件"
        ></v-file-input>
        <v-checkbox v-model="check" :disabled="isProcessing" label="测试模式(只翻译前10个段落)"></v-checkbox>
        <template v-if="isProcessing">
          <v-progress-circular indeterminate></v-progress-circular>
          {{ progress }}%/100% 预计剩余时间:{{ remainTime }}
        </template>
        <v-btn size="large" v-else color="primary" @click="processPDF" :loading="isProcessing">
          翻译并预览 PDF
        </v-btn>
        <v-btn class="ml-1" :disabled="isProcessing" size="large" color="primary" @click="generatePdf">
          下载PDF
        </v-btn>
      </div>
    </div>
  </div>
</template>

<script setup>
import {ref, watch} from 'vue'
import {getDocument,} from 'pdfjs-dist'
import {doTranslation} from "@/translation.js";
import html2pdf from "html2pdf.js";

const displayParagraph = reactive([]);
// 新增变量：用于进度条显示
const isProcessing = ref(false); // 控制是否显示进度条
const progress = ref(0); // 进度值 (0-100)
const apiKey = ref(localStorage.getItem('apiKey') ?? '')
const file = ref(null)            // 原始PDF文件
const check = ref(false)
const remainTime = ref("-")
const pdfDoc = ref(null)

watch(apiKey, (newVal, oldVal) => {
  localStorage.setItem('apiKey', newVal)
})

// 提取 PDF 文字并调用翻译函数
async function processPDF() {
  isProcessing.value = true;
  progress.value = 0;

  // 确保用户上传了 PDF 文件
  if (!file.value) {
    alert('请上传一个 PDF 文件')
    isProcessing.value = false
    return
  }
  displayParagraph.length = 0

  // 使用 pdf.js 加载 PDF 文档
  const url = URL.createObjectURL(file.value) // PDF 文件的 URL
  const doc = await getDocument(url).promise  // 加载 PDF 文档
  const allTexts = []                           // 存储所有页面的文字信息
  const pageCount = doc.numPages              // 获取 PDF 页数

  // 提取所有页面的内容
  for (let i = 1; i <= pageCount; i++) {
    const page = await doc.getPage(i)         // 加载对应页面
    const textContent = await page.getTextContent()
    const pageText = textContent.items.map(item => {
      item.page = i
      return item
    })
    allTexts.push(...pageText)                   // 收集每页的文字内容
  }
  const paragraph = await generateParagraph(allTexts, (await doc.getPage(1)).getViewport({scale: 1}))
  displayParagraph.push(...paragraph)
// 动态估算剩余时间
  for (let i = 0; i < displayParagraph.length; i++) {
    const p = displayParagraph[i];

    const startTime = performance.now(); // 起始时间

    if (!check.value || i < 10) {
      p.translating = true;
      p.translate = await doTranslation(p.content, apiKey.value);
      p.translating = false;
    }

    // 每段翻译结束后计算耗时
    const elapsedTime = performance.now() - startTime; // 单次翻译耗时（ms）

    // 估算剩余段落的翻译时间
    const remainingTimeMs = elapsedTime * (paragraph.length - (i + 1));
    // 转换成分钟和秒
    const remainingMinutes = Math.floor(remainingTimeMs / 60000);
    const remainingSeconds = Math.floor((remainingTimeMs % 60000) / 1000);

    // 更新进度和提示
    progress.value = Math.round(((i + 1) / paragraph.length) * 100);
    remainTime.value = `${remainingMinutes} 分 ${remainingSeconds} 秒`
  }


  // 翻译完成后隐藏进度条并更新显示内容
  displayParagraph.value = paragraph;
  isProcessing.value = false;
}

function generatePdf() {
  html2pdf(pdfDoc.value, {margin: 4, html2canvas: {scale: 4}, pagebreak: {mode: ['avoid-all', 'css', 'legacy']}});
}

async function generateParagraph(allTextContent, viewport) {
  const paragraphs = []; // 用于保存分组的段落
  let currentParagraph = null; // 当前段落（基于 fontSize）
  let lastY = null
  let lastPage = null
  let lastLineHeight = null
  allTextContent.forEach((item) => {
    // 每个文本块信息
    if (item.str.trim() === '') return
    const formattedItem = {
      content: item.str, // 文本内容
      x: item.transform[4], // X 坐标
      y: viewport.height - item.transform[5], // Y 坐标（基础 PDF Y 方向反转处理）
      width: item.width, // 文本宽度
      height: item.height, // 文本高度
      fontSize: item.transform[0], // 字体大小
      page: item.page,
    };


    const shouldChangeParagraph = !currentParagraph || (Math.abs(formattedItem.y - lastY) > lastLineHeight * 2 && formattedItem.page === lastPage)
      || currentParagraph.fontSize !== formattedItem.fontSize
    // 如果段落尚未开始，或字体大小发生变化，创建新段落
    if (shouldChangeParagraph) {
      // 如果当前段落存在，先将其保存到段落列表
      if (currentParagraph) paragraphs.push(currentParagraph);
      // 创建新的段落
      currentParagraph = {
        fontSize: formattedItem.fontSize,
        items: [],
        x: formattedItem.x,
        y: formattedItem.y,
        width: formattedItem.width,
        height: formattedItem.height,
      };
      lastLineHeight = formattedItem.fontSize;
    }
    lastY = formattedItem.y
    lastPage = formattedItem.page
    // 将当前文字块加入到当前段落
    currentParagraph.items.push(formattedItem);
  });

  // 将最后一个段落存入数组中（防止丢失最后一组数据）
  if (currentParagraph) paragraphs.push(currentParagraph);
  console.log(paragraphs)

  // 返回格式化的段落数据
  return paragraphs.map((paragraph) => {
    paragraph.content = paragraph.items.map(item => item.content).join(' ')
    return paragraph
  })
}

</script>
