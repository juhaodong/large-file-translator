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
                <div v-if="displayMode==='双语'||displayMode==='原文'" v-html="renderMarkdown(p.text)"></div>
                <div v-if="p.processing">
                  .......
                </div>
                <div
                  v-html="renderMarkdown(p.translatedText)"
                  v-if="p.translatedText&&p.translatedText!==p.text&&(displayMode!=='原文')"
                ></div>
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

          <div>
            <template v-if="file==null">
              <div class="text-h3 font-weight-black mb-8">
                欢迎使用PDF翻译大王👑
              </div>
              <div class="text-h6 mb-8">
                不限制大小，页数，好用又便宜
              </div>
              <v-file-upload
                v-if="file===null"
                accept=".pdf"
                title="把PDF拖到这"
                divider-text="或者说"
                browse-text="点这里从本地上传"
                :disabled="isProcessing" prepend-icon="" append-inner-icon="mdi-file" v-model="file"
                label="选择 PDF 文件"
              ></v-file-upload>
            </template>

            <template v-if="file">
              <h2 class="text-h4 mb-8">正在分析和翻译🔍{{ docName }}</h2>
              <template v-if="loadingFile">
                <div class="text-body-2">
                  根据上传的文件大小来说，有可能需要几分钟的时间，请耐心等待，在分析期间，请不要关闭浏览器窗口。
                </div>
                <v-progress-linear indeterminate></v-progress-linear>
              </template>
              <template v-else>
                <v-select class="mt-2" :items="['中文','原文','双语']" v-model="displayMode"></v-select>

                <div

                  style="display: grid;grid-template-columns: repeat(auto-fill,12px);grid-gap: 2px"
                >
                  <v-card
                    flat
                    tile
                    height="12" width="12" v-for="p in displayParagraph"
                    :color="p.translatedText?'green':(p.processing?'yellow':'white')"
                  >
                  </v-card>
                </div>

                <div class="mt-4" style="display: grid;grid-gap: 16px">
                  <v-btn v-if="!pdfReady" size="large" color="green" @click="processPDF" :loading="isProcessing">
                    翻译并预览 PDF
                  </v-btn>
                  <v-btn
                    v-if="pdfReady" :disabled="isProcessing" size="large" color="blue" @click="generatePdf"
                  >
                    下载PDF
                  </v-btn>
                  <v-btn @click="reset" size="large" color="blue">
                    回到开始
                  </v-btn>
                </div>
              </template>


            </template>


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
  if (src.startsWith('_')) {
    tokens[idx].attrSet('src', "data:image/jpg;base64," + imageDic[src])
    tokens[idx].attrSet('style', "max-width:100%;")
  }

  return defaultImageRenderer(tokens, idx, options, env, self)
};


const displayMode = ref("双语")
const userStore = useUserStore()

const displayParagraph = reactive([]);
const loadingFile = ref(false)
// 新增变量：用于进度条显示
const isProcessing = ref(false); // 控制是否显示进度条
const file = ref(null)            // 原始PDF文件
const pdfDoc = ref(null)
const pdfReady = ref(false)
const docName = ref('')
let currentFileHash = ""

function renderMarkdown(markdownText) {
  return md.render(markdownText)
}

function reset() {
  file.value = null
  loadingFile.value = false
  displayParagraph.length = 0
  pdfReady.value = false
  displayMode.value = "双语"
}

watch(file, async () => {
  docName.value = file.value.name
  loadingFile.value = true
  const {result, document} = await createAndAnalysisFile(file.value, userStore.currentUser.id)
  displayParagraph.length = 0
  console.log(result, document)
  imageDic = result?.images ?? {}
  if (result?.output) {
    displayParagraph.push(...document)
    currentFileHash = document[0].fileHash
  }
  pdfReady.value = !displayParagraph.find(it => it.translatedText === null)
  loadingFile.value = false
  console.log(result)

})


// 提取 PDF 文字并调用翻译函数
async function processPDF() {
  isProcessing.value = true;
  await startTranslation(currentFileHash, userStore.currentUser.id, (status) => {
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
