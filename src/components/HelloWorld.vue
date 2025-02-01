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
                v-for="p in displayParagraph" class="mt-8" :style="{fontSize: p.fontSize + 'px'}"
                style="width: 100%"
              >
                <div :style="{fontSize:p.fontSize*0.8+'px'}">{{ p.content }}</div>
                <v-progress-linear indeterminate v-if="p.translating" style="width: 100%"></v-progress-linear>
                <div>{{ p.translate }}</div>
              </div>
            </div>
          </div>

        </div>
      </div>

      <div style="width: 100%" class="pa-8">
        <div class="text-h1 font-weight-black mb-8">
          翻译大王👑
        </div>
        <div class="text-h4 mb-8">
          好用又便宜（免费试用版）
        </div>
        <v-text-field :disabled="isProcessing" v-model="apiKey" label="输入你的api key"></v-text-field>
        <v-file-upload
          :disabled="isProcessing" prepend-icon="" append-inner-icon="mdi-file" v-model="file" label="选择 PDF 文件"
        ></v-file-upload>
        <v-checkbox v-model="check" :disabled="isProcessing" label="测试模式(只翻译前10个段落)"></v-checkbox>
        <template v-if="isProcessing">
          <v-progress-circular indeterminate></v-progress-circular>
          {{ progress }}%/100% 预计剩余时间:{{ remainTime }}
        </template>
        <v-btn size="large" v-else color="green" @click="processPDF" :loading="isProcessing">
          翻译并预览 PDF
        </v-btn>
        <v-btn class="ml-1" v-if="pdfReady" :disabled="isProcessing" size="large" color="black" @click="generatePdf">
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
import jsPDF from "jspdf";
import '@/font.js'

const displayParagraph = reactive([]);
// 新增变量：用于进度条显示
const isProcessing = ref(false); // 控制是否显示进度条
const progress = ref(0); // 进度值 (0-100)
const apiKey = ref(localStorage.getItem('apiKey') ?? '')
const file = ref(null)            // 原始PDF文件
const check = ref(false)
const remainTime = ref("-")
const pdfDoc = ref(null)
const pdfReady = ref(false)
const docName = ref('')

watch(apiKey, (newVal, oldVal) => {
  localStorage.setItem('apiKey', newVal)
})
watch(file, (newVal, oldVal) => {
  console.log(file.value)
  pdfReady.value = false
  showTextInPdf()
})

async function showTextInPdf() {
  displayParagraph.length = 0

  // 使用 pdf.js 加载 PDF 文档
  const url = URL.createObjectURL(file.value) // PDF 文件的 URL
  const doc = await getDocument(url).promise  // 加载 PDF 文档
  const allTexts = []                           // 存储所有页面的文字信息
  const pageCount = doc.numPages              // 获取 PDF 页数
  docName.value = file.value.name
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
}

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

// 动态估算剩余时间
  const BATCH_SIZE = 200; // 每批并发任务数
  let processedCount = 0; // 已完成的请求计数
  let totalElapsedTime = 0; // 累计已完成请求的耗时

  for (let batchStart = 0; batchStart < displayParagraph.length; batchStart += BATCH_SIZE) {
    const batchEnd = Math.min(batchStart + BATCH_SIZE, displayParagraph.length);
    const batch = displayParagraph.slice(batchStart, batchEnd);

    // 批量并发任务
    await Promise.allSettled(
      batch.map(async (p, index) => {
        const overallIndex = batchStart + index; // 全局段落索引
        if (!check.value || overallIndex < 10) {
          p.translating = true;

          // 记录单个请求的开始时间
          const startTime = performance.now();
          try {
            p.translate = await doTranslation(p.content, apiKey.value);
          } catch (error) {
            console.error(`段落翻译失败：${error}`);
            p.translate = "翻译失败";
          } finally {
            p.translating = false;

            // 更新已处理的段落计数和累计耗时
            const elapsedTime = performance.now() - startTime;
            totalElapsedTime += elapsedTime; // 累计耗时
            processedCount++; // 增量已处理计数
          }

          // 动态更新剩余时间和进度
          const averageTimePerRequest = totalElapsedTime / processedCount; // 平均单个请求耗时
          const remainingRequests = displayParagraph.length - processedCount; // 剩余段落数
          const remainingTimeMs = averageTimePerRequest * remainingRequests; // 剩余总时间（毫秒）

          const remainingMinutes = Math.floor(remainingTimeMs / 60000);
          const remainingSeconds = Math.floor((remainingTimeMs % 60000) / 1000);

          progress.value = Math.round((processedCount / displayParagraph.length) * 100); // 更新进度
          remainTime.value = `${remainingMinutes} 分 ${remainingSeconds} 秒`; // 更新剩余时间
        }
      })
    );

    console.log(`批次 ${batchStart / BATCH_SIZE + 1} 完成，总进度：${progress.value}%`);
  }
  pdfReady.value = true
  isProcessing.value = false;
}

function generatePdf() {
  const doc = new jsPDF()
  doc.setFont('han')
  let cursorY = 10;
  cursorY = addWrappedText({
    doc,
    text: "本文由翻译大王翻译，翻译就用翻译大王！！ Developed by Haodong Ju",
    fontSize: 14,
    initialYPosition: cursorY,
  })
  cursorY += 10
  for (let i = 0; i < displayParagraph.length; i++) {
    const p = displayParagraph[i]
    const baseFontSize = p.fontSize * 0.8
    cursorY = addWrappedText({
      doc,
      text: p.content,
      fontSize: baseFontSize * 0.8,
      initialYPosition: cursorY,
    })
    if (p.translate) {
      cursorY = addWrappedText({
        doc,
        text: p.translate,
        fontSize: baseFontSize,
        initialYPosition: cursorY,
      })
    }

    cursorY += 20
  }
  doc.save((docName.value ?? performance.now()) + '.pdf')
}

function addWrappedText({
                          text,
                          doc,
                          fontSize = 10,

                          xPosition = 10,
                          initialYPosition = 10,
                          pageWrapInitialYPosition = 10
                        }) {
  doc.setFontSize(fontSize);
  const textLines = doc.splitTextToSize(text, doc.internal.pageSize.width - 20); // Split the text into lines
  const pageHeight = doc.internal.pageSize.height - 20;        // Get page height, we'll use this for auto-paging. TRANSLATE this line if using units other than `pt`
  let cursorY = initialYPosition;
  const lineSpacing = fontSize * 0.6;
  textLines.forEach(lineText => {
    if (cursorY > pageHeight) { // Auto-paging
      doc.addPage();
      cursorY = pageWrapInitialYPosition;
    }
    doc.text(xPosition, cursorY, lineText);
    cursorY += lineSpacing;
  })
  return cursorY
}

async function generateParagraph(allTextContent, viewport) {
  const paragraphs = []; // 用于保存分组的段落
  let currentParagraph = null; // 当前段落（基于 fontSize）
  let lastY = null
  let lastPage = null
  let lastLineHeight = null
  allTextContent.forEach((item) => {
    // 每个文本块信息
    if (item.str.trim().length < 3) return
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
