<template>
  <div class="fill-height">
    <div>


      <div style="width: 100%;" class="d-flex flex-column">
        <div
          style="height: calc(100vh - 64px)"
          class="d-flex flex-column flex-grow-1"
        >
          <div
            class="pa-8 flex-grow-1 d-flex flex-column justify-center"
            v-if="infoStore.fileInfoLoading"
          >
            <div class="text-h3 font-weight-black mb-8">
              正在加载文件信息....
            </div>
            <div class="text-h6 mb-8">
              请耐心等待片刻
            </div>
          </div>
          <div class="pa-8 flex-grow-1 d-flex flex-column" style="height: 100vh" v-else-if="!infoStore.fileInfo">
            <user-head></user-head>
            <div class="text-h4 font-weight-black mb-4 mt-8">
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
              prepend-icon=""
              append-inner-icon="mdi-file"
              v-model="file"
              label="选择 PDF 文件"
            ></v-file-upload>
            <template v-else-if="loadingFile">
              <div class="text-h4">
                ⌛ 正在上传文件
              </div>
              <div class="text-body-1 text-center" v-if="loadingFile">
                根据文件大小和网速情况，可能需要最长5分钟，在这个过程中，请不要关闭浏览器窗口
              </div>
            </template>
            <template v-else>
              <div class="text-h4">
                上传文件时发生了一些错误
              </div>
            </template>
            <v-spacer></v-spacer>
            <div class="mt-8 text-body-1">
              这是翻译大王@2025 Developed by Haodong Ju & Shang
            </div>
          </div>
          <template v-else>
            <div :style="lgAndUp?'display: grid;grid-template-columns: repeat(2,minmax(0,1fr))':''">
              <div ref="leftContainerDom" class="flex-grow-1" style="height:calc(100vh);overflow-y:scroll;width: 100%">


                <div ref="pdfDocDom" class="pa-8">
                  <div
                    class="bg-grey-lighten-4 elevation-4 rounded-lg"
                    :class="lgAndUp?'pa-8':'pa-6'"
                    style="min-height: 100%;width: 100%;max-width: 896px;margin: auto"
                  >
                    <template v-if="infoStore.displayParagraph.length===0">
                      <div
                        class="text-h4  d-flex flex-column align-center text-center justify-center"
                        style="min-height: calc(100vh - 120px)"
                      >
                        <v-progress-circular indeterminate></v-progress-circular>
                        <div class="text-h5 mt-6">
                          ⌛ 您的文件正在后台处理中
                        </div>
                        <div class="text-body-2 text-center mt-2 mx-8">
                          根据文件大小和网速情况，可能需要最长30分钟，您可以随时刷新或离开本页面。当任务结束时，我们会向您的邮箱发送邮件。
                        </div>
                      </div>
                    </template>
                    <template v-else>
                      <v-lazy
                        :key="p.id"
                        :id="'block'+p.id"
                        v-for="p in infoStore.displayParagraph" :min-height="24"
                        :options="{'threshold':0.5}"
                        transition="fade-transition"
                      >
                        <div
                          class="mt-8 text-break"
                          style="width: 100%"
                          v-intersect="{
                       handler: (isIntersecting, entries, observer)=>
                       onIntersect(isIntersecting, entries, observer,p.id),
                             options: {
                                    threshold: [1.0]
                                  }
                               }"

                        >
                          <div
                            v-if="displayMode==='双语'||displayMode==='原文'" v-html="infoStore.renderMarkdown(p.text)"
                          ></div>
                          <div v-if="p.processing">
                            .......
                          </div>
                          <div
                            v-html="infoStore.renderMarkdown(p.translatedText)"
                            v-if="p.translatedText&&p.translatedText!==p.text&&(displayMode!=='原文')"
                          ></div>
                        </div>
                      </v-lazy>
                    </template>
                  </div>
                </div>

              </div>
              <div v-if="lgAndUp" class="pa-8 d-flex flex-column" style="height:calc(100vh);">
                <user-head/>
                <div class="px-4 ">
                  <h2 class="text-h5 mb-4 font-weight-black">正在分析和翻译🔍</h2>
                  <div class="text-body-1 mb-12">
                    {{ infoStore.docName }}
                  </div>
                  <div class="text-h5 mb-4 font-weight-black">当前进展: {{ infoStore.fileStatus }}</div>
                  <div class="text-caption mb-12 rounded-lg bg-grey-darken-4 pa-4">
                    <div v-for="c in infoStore.progressConsole">
                      {{ c }}
                    </div>
                  </div>
                  <div class="text-h5 mb-4 font-weight-black">
                    文章进度
                  </div>
                  <div>
                    <v-slider @update:model-value="changeProgress" v-model="progressReading" max="100"></v-slider>
                  </div>
                  <div>
                    <template v-if="loadingFile">
                      <div class="text-body-2">
                        根据上传的文件大小来说，有可能需要几分钟的时间，请耐心等待，在分析期间，请不要关闭浏览器窗口。
                      </div>
                      <v-progress-linear indeterminate></v-progress-linear>
                    </template>
                    <template v-else>
                      <v-select class="mt-2" :items="['中文','原文','双语']" v-model="displayMode"></v-select>
                      <div
                        class="mt-4"
                        style="display: grid;grid-gap: 16px;grid-template-columns: repeat(2,minmax(0,1fr));"
                      >
                        <v-btn
                          size="large" color="yellow" @click="generatePdf"
                        >
                          下载PDF
                        </v-btn>
                        <v-btn @click="reset" size="large" color="white">
                          翻译其他文件
                        </v-btn>
                      </div>
                    </template>
                  </div>

                </div>
                <v-spacer></v-spacer>
                <div class="mt-8 text-body-1">
                  这是翻译大王@2025 Developed by Haodong Ju & Shang
                </div>


              </div>
              <template v-else>
                <template v-if="loadingFile">
                  <v-card
                    style="position: fixed;right: 5%;bottom: 5%;width: 90%"
                    class="pa-6 px-6 text-h6" rounded="xl" color="black"
                  >
                    <h2 class="text-h4 font-weight-black">正在分析和翻译🔍</h2>
                    <div class="text-body-1 mb-4">
                      {{ docName }}
                    </div>
                    <div class="text-body-2 mb-4">
                      根据上传的文件大小来说，有可能需要几分钟的时间，请耐心等待，在分析期间，请不要关闭浏览器窗口。
                    </div>
                    <v-progress-linear indeterminate></v-progress-linear>
                  </v-card>
                </template>
                <template v-else-if="!pdfReady">
                  <v-card
                    @click="processPDF"
                    style="position: fixed;right: 5%;bottom: 5%;width: 90%"
                    class="pa-4 px-6 text-h6" rounded="xl" color="black"
                  >
                    <div
                      v-if="isProcessing"
                      style="display: grid;grid-template-columns: repeat(auto-fill,12px);grid-gap: 2px"
                    >
                      <v-progress-linear indeterminate></v-progress-linear>
                    </div>
                    <template v-else>
                      <v-icon class="mr-4">mdi-send</v-icon>
                      翻译并预览 PDF
                    </template>


                  </v-card>
                </template>
                <v-card
                  v-else
                  @click="expandToolBox=!expandToolBox"
                  style="position: fixed;right: 5%;bottom: 5%;"
                  :style="expandToolBox?'width:90%':''"
                  class="pa-4 px-6 d-flex align-center text-h6" rounded="xl" color="black"
                >


                  <template v-if="expandToolBox">
                    <div @click.stop style="width: 100%" class="pa-4">
                      <div>
                        <div class="text-h6 font-weight-black">
                          正在显示
                        </div>
                        <v-card
                          @click="reset"
                          class="text-body-2 text-truncate d-flex align-center mb-4 pa-2 bg-grey-darken-3"
                          style="width: 100%"
                        >
                          <v-icon>mdi-file-document</v-icon>
                          <div class="mx-2 flex-grow-1 text-truncate">{{ docName }}</div>
                          <v-icon>mdi-close</v-icon>
                        </v-card>
                      </div>

                      <div>

                        <v-select
                          class="mt-2" :items="['中文','原文','双语']" v-model="displayMode"
                        ></v-select>

                        <div class="mt-2" style="display: grid;grid-gap: 16px;">
                          <v-btn
                            :disabled="infoStore.fileStatus!=='Done'"
                            size="large" color="white" @click="generatePdf"
                          >
                            下载PDF
                          </v-btn>
                        </div>

                      </div>
                      <v-spacer></v-spacer>
                      <div class="mt-8 text-caption">
                        这是翻译大王@2025 Developed by Haodong Ju & Shang
                      </div>
                      <div class=" text-center" @click="expandToolBox=false">
                        <v-icon size="small">mdi-close</v-icon>
                      </div>
                    </div>

                  </template>
                  <template v-else>
                    <v-icon class="mr-4">mdi-cog</v-icon>
                    更多设置
                  </template>
                </v-card>
              </template>
            </div>


          </template>


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
import {ref, watch} from 'vue'
import jsPDF from "jspdf";
import '@/font.js'
import LoginForm from "@/views/components/LoginForm.vue";
import {useUserStore} from "@/plugins/supabase.js";
import {useDisplay, useGoTo} from "vuetify";
import {calculateFileHash, getFileDetailByFileHash, uploadPdfFile} from "@/dataLayer/cloudApi.js";
import {useInfoDisplayStore} from "@/plugins/stores/infoDisplayStore.js";
import UserHead from "@/views/components/UserHead.vue";

const pdfDocDom = ref(null)
const leftContainerDom = ref(null)
const userStore = useUserStore()
const infoStore = useInfoDisplayStore()
const progressReading = ref(0)

const {lgAndUp} = useDisplay()
const expandToolBox = ref(false)
const displayMode = ref("双语")

const loadingFile = ref(false)
const file = ref(null)


onMounted(async () => {
  await infoStore.loadCurrentFileInfo()
})
let lock = false
const goTo = useGoTo()

function onIntersect(isIntersecting, entries, observer, id) {
  const total = infoStore.displayParagraph.length
  if (isIntersecting && !lock) {
    const index = infoStore.displayParagraph.findIndex(p => p.id === id)
    progressReading.value = Math.round(index / total * 100)
  }

}

function changeProgress(progress) {
  const total = infoStore.displayParagraph.length
  const index = Math.round(total * progress / 100)
  if (index < total) {
    lock = true
    goTo('#block' + infoStore.displayParagraph[index].id, {
      container: leftContainerDom.value,
    })
    setTimeout(() => {
      lock = false
    }, 1000)
  }
}


function reset() {
  infoStore.onFileHashChange(null)
  file.value = null
}

watch(file, async () => {
  await onFileChange()
})

async function onFileChange() {
  const filePlain = file.value
  if (filePlain !== null) {
    loadingFile.value = true
    const fileHash = await calculateFileHash(filePlain)
    const existInfo = await getFileDetailByFileHash(fileHash)
    if (!existInfo) {
      try {
        const fileInfo = await uploadPdfFile(filePlain, userStore.currentUser.id)
        console.log(fileInfo)
      } catch (e) {
        console.log('失败')
        console.log(e)

      }
    }
    await infoStore.onFileHashChange(fileHash)
    loadingFile.value = false


  }

}


function generatePdf() {
  const doc = new jsPDF()
  doc.setFont('han')
  let cursorY = 10;
  cursorY = addWrappedText({
    doc,
    text: "本文由翻译大王翻译，翻译就用翻译大王👑！！ Developed by Haodong Ju & Shang",
    fontSize: 14,
    initialYPosition: cursorY,
  })
  cursorY += 10
  for (let i = 0; i < displayParagraph.length; i++) {
    const p = displayParagraph[i]
    const baseFontSize = 14 * 0.8
    cursorY = addWrappedText({
      doc,
      text: p.text,
      fontSize: baseFontSize * 0.8,
      initialYPosition: cursorY,
    })
    if (p.translatedText && p.translatedText !== p.text) {
      cursorY = addWrappedText({
        doc,
        text: p.translatedText,
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
