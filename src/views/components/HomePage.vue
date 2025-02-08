<template>
  <div class="fill-height">
    <div style="display: grid;grid-template-columns: repeat(2,minmax(0,1fr))">
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
                :key="p.id"
                v-for="p in displayParagraph" class="mt-8"
                style="width: 100%"
              >
                <div v-html="renderMarkdown(p.text)"></div>
                <div v-if="p.processing">
                  .......
                </div>
                <div v-html="renderMarkdown(p.translatedText)" v-if="p.translatedText"></div>
              </div>
            </div>
          </div>

        </div>
      </div>
      <div style="height: 100vh" class="d-flex flex-column">
        <v-card class="pa-2 px-4 d-flex align-center" tile v-if="userStore.currentUser">
          <div class="text-caption">
            欢迎：{{ userStore.currentUser.email }}
          </div>
          <v-spacer></v-spacer>
          <v-btn @click="userStore.showAddCredit=true" color="white" flat prepend-icon="mdi-wallet">
            {{ userStore.currentCredit }}
          </v-btn>

        </v-card>
        <div style="width: 100%;overflow-y: scroll" class="pa-8 d-flex flex-column flex-grow-1">
          <div class="text-h3 font-weight-black mb-8">
            欢迎使用PDF翻译大王👑
          </div>
          <div class="text-h6 mb-8">
            不限制大小，页数，好用又便宜
          </div>
          <div>
            <v-file-upload
              accept=".pdf"
              title="把PDF拖到这"
              divider-text="或者说"
              browse-text="点这里从本地上传"
              :disabled="isProcessing" prepend-icon="" append-inner-icon="mdi-file" v-model="file" label="选择 PDF 文件"
            ></v-file-upload>
            <v-checkbox v-model="check" :disabled="isProcessing" label="测试模式(只翻译前10个段落)"></v-checkbox>
            <template v-if="isProcessing">
              <div style="display: grid;grid-template-columns: repeat(auto-fill,12px);grid-gap: 2px">
                <v-card
                  flat
                  tile
                  height="12" width="12" v-for="p in displayParagraph"
                  :color="p.translate?'green':(p.processing?'yellow':'white')"
                >
                </v-card>
              </div>

              预计剩余时间:{{ remainTime }}
            </template>
            <v-btn size="large" v-else color="green" @click="processPDF" :loading="isProcessing">
              翻译并预览 PDF
            </v-btn>
            <v-btn
              class="ml-1" v-if="pdfReady" :disabled="isProcessing" size="large" color="black" @click="generatePdf"
            >
              下载PDF
            </v-btn>
          </div>
          <v-spacer></v-spacer>
          <div class="mt-8 text-body-1">
            这是翻译大王@2025 Developed by Haodong Ju & Shang
          </div>
        </div>
      </div>


    </div>
    <login-form/>
    <v-dialog v-model="userStore.showAddCredit" width="min-content">
      <v-card color="black" class="py-4" style="width: min-content" min-height="200">
        <stripe-buy-button
          :client-reference-id="userStore.currentUser.id"
          :customer-email="userStore.currentUser.email"
          buy-button-id="buy_btn_1Qo52dEJRuEVURG7VrJH3LwX"
          publishable-key="pk_live_51Qo0FyEJRuEVURG7fdaxZKiQK2IE5HaGrEemR9OBHc2QY8IoLuSDxRTGYQUvmyLUZh1ia4xAAwJIHWUrUKMlcOop00X7HciJTz"
        >
        </stripe-buy-button>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import markdownit from 'markdown-it'
import {ref, watch} from 'vue'
import jsPDF from "jspdf";
import '@/font.js'
import LoginForm from "@/views/components/LoginForm.vue";
import {useUserStore} from "@/plugins/supabase.js";
import {createAndAnalysisFile, startTranslation} from "@/dataLayer/cloudApi.js";

const md = markdownit({
  linkify: true,
  breaks: true,
  typographer: true,
})
const defaultImageRenderer = md.renderer.rules.image
let imageDic = {}
md.renderer.rules.image = (tokens, idx, options, env, self) => {
  const src = tokens[idx].attrGet('src')
  console.log(src, imageDic)
  if (src.startsWith('_')) {
    tokens[idx].attrSet('src', "data:image/jpg;base64," + imageDic[src])
    tokens[idx].attrSet('style', "max-width:100%;")
  }

  return defaultImageRenderer(tokens, idx, options, env, self)
};

const userStore = useUserStore()

const displayParagraph = reactive([]);
// 新增变量：用于进度条显示
const isProcessing = ref(false); // 控制是否显示进度条
const progress = ref(0); // 进度值 (0-100)
const file = ref(null)            // 原始PDF文件
const check = ref(false)
const remainTime = ref("-")
const pdfDoc = ref(null)
const pdfReady = ref(false)
const docName = ref('')
let currentFileHash = ""

function renderMarkdown(markdownText) {
  return md.render(markdownText)
}

watch(file, async () => {
  const {result, document} = await createAndAnalysisFile(file.value, userStore.currentUser.id)
  displayParagraph.length = 0
  console.log(result, document)
  imageDic = result?.images ?? {}
  if (result?.output) {
    displayParagraph.push(...document)
    currentFileHash = document[0].fileHash
  }

  console.log(result)

})


// 提取 PDF 文字并调用翻译函数
async function processPDF() {
  isProcessing.value = true;
  startTranslation(currentFileHash, userStore.currentUser.id, (status) => {
    const item = displayParagraph.find(p => parseInt(p.id) === parseInt(status.id))
    Object.keys(status).forEach(k => {
      item[k] = status[k]
    })
  })

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

</script>
<style>
#app > p > img {
  width: 100%;
}

</style>
