<template>
  <v-container class="fill-height">
    <v-row>
      <v-col cols="6">
        <v-file-input v-model="file" label="选择 PDF 文件"></v-file-input>
        <v-btn @click="processPDF">翻译并下载 PDF</v-btn>
      </v-col>
      <v-col cols="6" class="bg-white">
        <div v-for="p in displayParagraph" class="ma-8" :style="{fontSize: p.fontSize + 'px'}">
          {{ p.translate ?? p.content }}
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import {ref} from 'vue'
import {getDocument,} from 'pdfjs-dist'
import {doTranslation} from "@/translation.js";

const pdfCanvas = ref(null);
const displayParagraph = reactive([]);
// 新增变量：用于进度条显示
const isProcessing = ref(false); // 控制是否显示进度条
const progress = ref(0); // 进度值 (0-100)

const file = ref(null)            // 原始PDF文件

// 提取 PDF 文字并调用翻译函数
async function processPDF() {
  isProcessing.value = true;
  progress.value = 0;

  // 确保用户上传了 PDF 文件
  if (!file.value) {
    alert('请上传一个 PDF 文件')
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
    const textContent = await page.getTextContent() // 提取文字内容
    const pageText = textContent.items
    allTexts.push(...pageText)                   // 收集每页的文字内容
  }
  const paragraph = await generateParagraph(allTexts, (await doc.getPage(1)).getViewport({scale: 1}))
  displayParagraph.push(...paragraph)
  for (let i = 0; i < displayParagraph.length; i++) {
    const p = displayParagraph[i];
    p.translate = await doTranslation(p.content);
    console.log(p.translate)
    // 更新进度条
    progress.value = Math.round(((i + 1) / paragraph.length) * 100);
  }


  // 翻译完成后隐藏进度条并更新显示内容
  displayParagraph.value = paragraph;
  isProcessing.value = false;
}

async function generateParagraph(allTextContent, viewport) {
  const paragraphs = []; // 用于保存分组的段落
  let currentParagraph = null; // 当前段落（基于 fontSize）

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
    };
    // 如果段落尚未开始，或字体大小发生变化，创建新段落
    if (!currentParagraph || currentParagraph.fontSize !== formattedItem.fontSize) {
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
    }

    // 将当前文字块加入到当前段落
    currentParagraph.items.push(formattedItem);
  });

  // 将最后一个段落存入数组中（防止丢失最后一组数据）
  if (currentParagraph) paragraphs.push(currentParagraph);

  // 返回格式化的段落数据
  return paragraphs.map((paragraph) => {
    paragraph.content = paragraph.items.map(item => item.content).join(' ')
    return paragraph
  })
}

// 下载生成的 PDF 文件
function downloadPDF(pdfBytes, filename) {
  const blob = new Blob([pdfBytes], {type: 'application/pdf'})    // 创建 Blob 对象
  const url = URL.createObjectURL(blob)                            // 创建下载链接
  const link = document.createElement('a')                         // 创建 <a> 标签
  link.href = url
  link.download = filename
  link.click()                                                     // 触发下载
  URL.revokeObjectURL(url)                                         // 释放 URL
}
</script>
