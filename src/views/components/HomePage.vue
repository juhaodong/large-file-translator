<template>
  <div
    @dragover.prevent
    @dragenter.prevent="onDragEnter"
    @dragleave.prevent="onDragLeave"
    @drop.prevent="onDrop"
    class="fill-height"
  >
    <div
      v-if="showDragOverlay"
      class="drag-overlay"
    >
      <div class="drag-overlay-content">
        <v-icon size="72" color="grey lighten-2">mdi-cloud-upload</v-icon>
        <div class="text-h4 mt-4 font-weight-black">
          将文件拖到这里以上传
        </div>
        <div class="text-body-1 mt-2">
          支持拖拽多种文件，例如 PDF
        </div>
      </div>
    </div>

    <div>
      <div style="width: 100%;" class="d-flex flex-column">
        <div
          style="height: calc(100vh - 64px)"
          class="d-flex flex-column flex-grow-1"
        >
          <div
            style="max-width: 1600px;width: 100%;margin: auto"
            class="pa-8  flex-grow-1 d-flex flex-column justify-center"
            :class="lgAndUp?'ml-16 pl-16':'mt-12'"
            v-if="infoStore.fileInfoLoading"
          >
            <div class="text-h3 font-weight-black mb-8">
              正在加载文件信息....
            </div>
            <div class="text-h6 mb-8">
              请耐心等待片刻
            </div>
          </div>
          <div
            class="pa-8 flex-grow-1 d-flex flex-column"
            style="height: 100vh;max-width: 1600px;width: 100%;margin: auto"
            v-else-if="!infoStore.fileInfo"
          >
            <user-head></user-head>
            <template v-if="fileRef==null">
              <div class="text-h4 font-weight-black mb-2 mt-8">
                欢迎使用PDF翻译大王
              </div>
              <div class="text-body-2 mb-4">
                几乎不限制大小(<495M)，不限制页数，好用又便宜
              </div>
              <v-file-upload
                height="100%"
                rounded="xl"
                color="grey-lighten-5"
                class="flex-grow-1"

                v-if="fileRef===null"
                accept=".pdf"
                title="把PDF拖到这里"
                divider-text="或者说"
                browse-text="点这里从本地上传"
                prepend-icon=""
                append-inner-icon="mdi-file"
                v-model="fileRef"
                label="选择 PDF 文件"
              ></v-file-upload>
            </template>

            <template v-else-if="loadingFile">
              <div class="mt-12 rounded-lg pb-12">
                <div class="text-h4 mt-8 font-weight-black">
                  ⌛ 请耐心等待
                </div>
                <v-progress-linear
                  indeterminate
                  height="8"
                  rounded="lg"
                  rounded-bar
                  color="#5FA8FF"
                  class="my-8"
                ></v-progress-linear>
                <div class="text-body-1 mt-8">
                  正在上传您的文件
                </div>
                <div class="text-body-2 mt-2">
                  根据文件大小和网速情况，可能需要最长5分钟，在这个过程中，请不要关闭浏览器窗口
                </div>
              </div>
            </template>
            <template v-else>
              <div class="mt-12 rounded-lg pb-12">
                <v-icon size="72" color="red">mdi-alert</v-icon>
                <div class="text-h4 mt-8 font-weight-black">
                  上传文件时发生了一些错误
                </div>
                <div class="text-body-1 mt-12">
                  这可能是由于网络情况糟糕或者文件过大。
                </div>
                <div class="text-body-2 mt-2">
                  请不要担心，对于这种情况，我们不会向您收取任何费用。
                </div>
                <div class="mt-12">
                  <v-btn
                    color="black"
                    flat prepend-icon="mdi-refresh" @click="reset"
                  >
                    重新选择文件并上传
                  </v-btn>
                </div>
              </div>


            </template>
            <v-spacer></v-spacer>
            <app-footer></app-footer>
          </div>
          <template v-else>
            <div :style="lgAndUp?'display: grid;grid-template-columns: repeat(2,minmax(0,1fr))':''">
              <div
                ref="leftContainerDom"
                class="flex-grow-1 bg-grey-lighten-3 d-flex flex-column justify-center"
                :class="lgAndUp?'px-8':''"
                style="height:calc(100vh);width: 100%"
              >
                <div ref="pdfDocDom">
                  <div
                    class="bg-white elevation-1 rounded-lg"
                    :class="lgAndUp?'pa-8 px-12':'px-4 pb-16'"
                    :style="lgAndUp?'height: calc(100vh - 240px);max-width: 708px;margin: auto;':
                    'height: calc(100vh);padding-bottom: 120px;'"
                    style="overflow-y: scroll"
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
                      <app-footer class="mb-16" v-if="!lgAndUp"/>
                    </template>
                  </div>
                </div>

              </div>
              <div v-if="lgAndUp" class="pa-8 d-flex flex-column" style="height:calc(100vh);">
                <user-head/>
                <div class="">
                  <div class="my-12" style="display: grid;grid-template-columns: repeat(2,minmax(0,1fr))">
                    <div>
                      <h2 class="text-h6 mb-2 font-weight-black">文件名</h2>
                      <div class="text-body-1 ">
                        {{ infoStore.docName }}
                      </div>
                    </div>

                  </div>


                  <div>
                    <template v-if="loadingFile">
                      <div class="text-body-2">
                        根据上传的文件大小来说，有可能需要几分钟的时间，请耐心等待，在分析期间，请不要关闭浏览器窗口。
                      </div>
                      <v-progress-linear indeterminate></v-progress-linear>
                    </template>
                    <template v-else>
                      <h2 class="text-h6 mb-2 font-weight-black">显示语言</h2>
                      <v-select
                        prepend-inner-icon="mdi-web" class="mt-2" :items="['中文','原文','双语']" v-model="displayMode"
                      ></v-select>
                      <div
                        class="mt-4"
                        style="display: grid;grid-gap: 16px;"
                      >
                        <v-btn
                          flat
                          rounded="lg"
                          color="black"
                          :loading="generatingPdf||infoStore.fileStatus!=='Done'"
                          :prepend-icon="infoStore.fileStatus==='Done'?'mdi-download':''"
                          size="x-large"
                          :disabled="infoStore.fileStatus!=='Done'"
                          @click="generatePdf"
                        >
                          <template v-if="infoStore.fileStatus!=='Done'">
                            <v-progress-circular indeterminate size="18" class="mr-4"></v-progress-circular>
                            <div class="text-capitalize">
                              {{ infoStore.fileStatus }}
                            </div>

                          </template>
                          <template v-else>
                            下载PDF
                          </template>

                        </v-btn>
                        <v-btn
                          flat
                          prepend-icon="mdi-arrow-left" @click="reset" size="x-large"
                        >
                          返回首页
                        </v-btn>

                      </div>
                    </template>
                  </div>

                </div>
                <v-spacer></v-spacer>

                <div class="text-body-2 mb-8 rounded-lg bg-grey-lighten-5 pa-4">
                  <div class="text-body-1 mb-2 d-flex">
                    当前进展: <b>{{ infoStore.fileStatus }}</b>
                    <div id="wave" v-if="infoStore.fileStatus!=='Done'">
                      <span class="dot"></span>
                      <span class="dot"></span>
                      <span class="dot"></span>
                    </div>
                  </div>
                  <div style="max-height: 150px;overflow-y: auto">
                    <div v-for="c in infoStore.progressConsole">
                      {{ c }}
                    </div>
                  </div>

                </div>
                <app-footer/>


              </div>
              <template v-else>
                <v-bottom-sheet v-model="expandToolBox">
                  <v-card @click.stop style="width: 100%" color="white" class="pa-4">

                    <div class="text-body-2 mb-4">
                      <div class="text-h6 font-weight-black">
                        正在显示
                      </div>
                      {{ infoStore.docName }}
                    </div>
                    <div class="text-body-2 mb-6 rounded-lg bg-grey-lighten-3 pa-4">
                      <div class="text-body-1 mb-2 d-flex">
                        当前进展: <b>{{ infoStore.fileStatus }}</b>
                        <div id="wave" v-if="infoStore.fileStatus!=='Done'">
                          <span class="dot"></span>
                          <span class="dot"></span>
                          <span class="dot"></span>
                        </div>
                      </div>
                      <div style="max-height: 150px;overflow-y: auto">
                        <div v-for="c in infoStore.progressConsole">
                          {{ c }}
                        </div>
                      </div>
                    </div>

                    <div>

                      <v-select
                        prepend-inner-icon="mdi-web"
                        class="mt-2" :items="['中文','原文','双语']" v-model="displayMode"
                      ></v-select>

                      <div
                        class="mt-2" style="display: grid;grid-gap: 16px;grid-template-columns: repeat(2,minmax(0,1fr))"
                      >
                        <v-btn
                          flat
                          prepend-icon="mdi-arrow-left"
                          @click="expandToolBox=false"
                          size="large"
                        >
                          返回
                        </v-btn>
                        <v-btn
                          flat
                          color="black"
                          prepend-icon="mdi-home"
                          size="large"
                          rounded="lg"
                          @click="reset"
                        >
                          返回首页
                        </v-btn>
                      </div>
                    </div>
                  </v-card>
                </v-bottom-sheet>
                <v-card
                  v-if="!expandToolBox"
                  elevation="8"
                  color="white"
                  class="d-flex px-4 py-2 align-center"
                  style="position: fixed;bottom: 0;width: 100%;"
                >
                  <v-btn
                    icon
                    color="transparent"
                    @click="expandToolBox=!expandToolBox"
                    rounded="xl"
                    flat
                  >
                    <v-icon>mdi-cog</v-icon>
                  </v-btn>
                  <v-btn
                    icon
                    color="transparent"
                    @click="userStore.showAddCredit=true"
                    rounded="xl"
                    flat
                  >
                    <v-icon>mdi-wallet</v-icon>
                  </v-btn>
                  <v-btn
                    icon
                    color="transparent"
                    @click="infoStore.showExtraInfo=true"
                    rounded="xl"
                    flat
                  >
                    <v-icon>mdi- mdi-information-outline</v-icon>
                  </v-btn>
                  <div style="width: 12px"></div>
                  <div class="d-flex text-body-2" v-if="infoStore.fileStatus!=='Done'">
                    {{ infoStore.fileStatus }}
                    <div id="wave">
                      <span class="dot"></span>
                      <span class="dot"></span>
                      <span class="dot"></span>
                    </div>
                  </div>
                  <v-spacer></v-spacer>
                  <v-btn
                    @click="generatePdf"
                    v-if="!expandToolBox"
                    :loading="generatingPdf||infoStore.fileStatus!=='Done'"
                    prepend-icon="mdi-download"
                    size="x-large"
                    flat
                    color="grey-lighten-3"
                    :disabled="infoStore.fileStatus!=='Done'"
                    rounded="xl"
                  >
                    下载
                  </v-btn>
                </v-card>
              </template>
            </div>
          </template>
        </div>
      </div>
    </div>
    <login-form/>
    <v-dialog v-model="userStore.showAddCredit" width="min-content">
      <v-card
        color="white"
        :class="lgAndUp?'px-12':'px-4'"
        class="py-4 d-flex align-center flex-column justify-center"
        rounded="xl" style="width: min-content" min-height="200"
      >
        <stripe-buy-button
          v-if="userStore.currentUser"
          :client-reference-id="userStore.currentUser.id"
          :customer-email="userStore.currentUser.email"
          buy-button-id="buy_btn_1Qo52dEJRuEVURG7VrJH3LwX"
          publishable-key="pk_live_51Qo0FyEJRuEVURG7fdaxZKiQK2IE5HaGrEemR9OBHc2QY8IoLuSDxRTGYQUvmyLUZh1ia4xAAwJIHWUrUKMlcOop00X7HciJTz"
        >
        </stripe-buy-button>
        <div class="text-body-2 my-4">或者</div>
        <v-btn
          @click="showRecommendDialog=true"
          flat
          rounded="lg"
          color="#5ae67f"
          prepend-icon="mdi-share"
        >推荐给你的朋友，免费获取积分
        </v-btn>
      </v-card>
    </v-dialog>
    <v-dialog v-model="errorDialog" max-width="600">
      <v-card color="white" class="pa-4 py-6">
        <div class="text-h6">错误</div>
        <div class="text-body-1 mt-4">{{ errorMessage }}</div>
        <div class="mt-4">
          <v-btn @click="errorDialog=false" color="black">好的</v-btn>
        </div>
      </v-card>
    </v-dialog>
    <v-dialog v-model="showRecommendDialog" max-width="600">
      <v-card rounded="xl" class="pa-4 py-6 d-flex flex-column">
        <div class="text-h6">您的积分用光了？没有关系!</div>
        <div class="text-body-2 mt-2">
          将下面的链接分享给你的朋友，如果你的朋友使用该链接注册并且购买了积分，您也将获得其购买积分10%的积分奖励。
        </div>
        <v-card
          v-if="userStore.currentUser"
          @click="copyRefLink"
          flat color="grey-lighten-3"
          class="text-body-2 pa-4 mt-4 d-flex align-center"
        >
          https://fanyidawang.io?ref={{ userStore.currentUser.id }}
          <v-spacer></v-spacer>
          <template v-if="showOk">
            <v-icon color="success-darken-2">mdi-check</v-icon>
            复制成功
          </template>
          <v-icon v-else>mdi-content-copy</v-icon>

        </v-card>
        <qrcode-vue v-if="userStore.currentUser" class="mt-4" :size="188" :value="getRefLink()"></qrcode-vue>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import {ref, watch} from 'vue'
import jsPDF from "jspdf";
import '@/font.js'
import '@/han-bold.js'
import LoginForm from "@/views/components/LoginForm.vue";
import {Remember, useUserStore} from "@/plugins/supabase.js";
import {useDisplay} from "vuetify";
import {calculateFileHash, getFileDetailByFileHash, uploadPdfFile} from "@/dataLayer/cloudApi.js";
import {useInfoDisplayStore} from "@/plugins/stores/infoDisplayStore.js";
import UserHead from "@/views/components/UserHead.vue";
import AppFooter from "@/views/components/AppFooter.vue";
import QrcodeVue from 'qrcode.vue'

const errorDialog = ref(false)
const errorMessage = ref("Error")
const pdfDocDom = ref(null)
const leftContainerDom = ref(null)
const userStore = useUserStore()
const infoStore = useInfoDisplayStore()
const showRecommendDialog = ref(false)

const {lgAndUp} = useDisplay()
const expandToolBox = ref(false)
const displayMode = ref("双语")
const generatingPdf = ref(false)

const loadingFile = ref(false)
const fileRef = ref(null)
const showDragOverlay = ref(false);
const showOk = ref(false)

function copyRefLink() {
  try {
    navigator.clipboard.writeText(getRefLink());
  } catch (e) {

  }
  showOk.value = true
  setTimeout(() => {
    showOk.value = false
  }, 1000)

}

function getRefLink() {
  return "https://fanyidawang.io?ref=" + userStore.currentUser.id
}

let dragCounter = 0; // 使用计数器防止进入退出事件导致闪烁问题

function onDragEnter() {
  dragCounter++; // 每次进入增加计数
  showDragOverlay.value = true; // 显示覆盖层
}

function onDragLeave() {
  dragCounter--; // 每次离开减少计数
  if (dragCounter === 0) {
    showDragOverlay.value = false; // 仅在拖拽完全离开时隐藏覆盖层
  }
}

function onDrop(event) {
  dragCounter = 0; // 放置文件后重置计数器
  showDragOverlay.value = false;

  const files = event.dataTransfer.files;

  // 检查是否仅拖入了一个文件
  if (files.length !== 1) {
    showError("一次只能上传一个文件！");
    return;
  }

  const file = files[0]; // 获取单个文件

  // 调用校验函数进行文件验证
  const isValid = validateFile(file);

  if (!isValid) {
    return;
  }
  reset()
  fileRef.value = file;


}


onMounted(async () => {
  await infoStore.loadCurrentFileInfo()
})


function reset() {
  infoStore.onFileHashChange(null)
  Remember.currentFileHash = ""
  fileRef.value = null
  expandToolBox.value = false
}

watch(fileRef, async () => {
  await onFileChange()
})

async function onFileChange() {
  if (userStore.currentCredit > 0) {
    const filePlain = fileRef.value
    if (filePlain !== null) {
      loadingFile.value = true
      const fileHash = await calculateFileHash(filePlain)
      const existInfo = await getFileDetailByFileHash(fileHash)
      if (!existInfo) {
        try {
          await uploadPdfFile(filePlain, userStore.currentUser.id);
        } catch (e) {
          console.log('失败')
          console.log(e)

        }
      }
      await infoStore.onFileHashChange(fileHash)
      loadingFile.value = false
    }
  } else {
    userStore.showAddCredit = true
  }

}

const baseFontSize = 12
const yMargin = 20

function generatePdf() {
  generatingPdf.value = true
  setTimeout(() => {
    nextTick(async () => {
      try {
        const doc = new jsPDF()
        const parser = (new DOMParser())
        doc.setFont('han')

        let cursorY = yMargin;
        for (let i = 0; i < infoStore.displayParagraph.length; i++) {
          const p = infoStore.displayParagraph[i]
          const html = parser.parseFromString(infoStore.renderMarkdown(p.text), "text/html").body.firstChild
          const result = getToEnd(html)
          const task = {
            value: result[0],
            tagList: result.map(n => n.nodeName)
          }
          if (task.tagList.find(it => it?.startsWith('H'))?.substring(1) === "1") {
            doc.addPage()
            cursorY = yMargin
          }
          cursorY = await renderOnDoc({
            node: task, doc, initialYPosition: cursorY
          })
          if (p.translatedText && p.translatedText !== p.text) {
            const html = parser.parseFromString(infoStore.renderMarkdown(p.translatedText), "text/html").body.firstChild
            const result = getToEnd(html)
            cursorY = await renderOnDoc({
              node: {
                value: result[0],
                tagList: result.map(n => n.nodeName)
              }, doc, initialYPosition: cursorY
            })
          }
          cursorY += 8
        }
        doc.save(infoStore.docName.replace(/\.pdf$/i, '(CN).pdf')
          || 'output.pdf')
        doc.close()
      } catch (e) {
        console.error(e)
        showError("PDF生成失败！原因是:" + e?.message ?? '未知原因')
      }
      generatingPdf.value = false
    })

  }, 100)

}

async function renderOnDoc({
                             node,
                             doc,
                             initialYPosition = 10,
                           }) {
  let cursorY = initialYPosition;
  if (node.value.nodeName === '#text') {
    let fontSize = baseFontSize

    const headingLevel = node.tagList.find(it => it?.startsWith('H'))?.substring(1)
    if (headingLevel) {
      fontSize = fontSize + parseInt(7 - headingLevel) * 2
    }
    if (node.tagList.includes('STRONG') || node.tagList.includes('B') || node.tagList.includes('EM')) {
      doc.setFont('han', 'bold')
    }

    cursorY = addWrappedText({
      text: node.value.textContent,
      doc,
      fontSize,
      xPosition: 10,
      initialYPosition: cursorY,
    })
    doc.setFont('han', 'normal')
    return cursorY
  } else {

    const image = node.value
    if (image.src && !image.src.startsWith('http')) {
      let {width, height} = await imageDimensions(image.src)
      const aspectRatio = width / height
      const pageHeight = doc.internal.pageSize.height - yMargin * 2;
      const pageWidth = doc.internal.pageSize.width - 20;
      if (width > pageWidth) {
        width = pageWidth
        height = width / aspectRatio
      }
      height = Math.min(height, pageHeight - yMargin * 2)
      if ((height + cursorY) > pageHeight) {
        doc.addPage()
        cursorY = yMargin
      }

      doc.addImage(image, 10, cursorY, width, height)
      cursorY += height
    }

    return cursorY
  }

}

async function imageDimensions(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()

    // the following handler will fire after a successful loading of the image
    img.onload = () => {
      const {naturalWidth: width, naturalHeight: height} = img
      resolve({width, height})
    }

    // and this handler will fire if there was an error with the image (like if it's not really an image or a corrupted one)
    img.onerror = () => {
      reject('There was some problem with the image.')
    }

    img.src = src
  })

}

function validateFile(file) {
  const fileType = file.type;
  const fileSize = file.size / (1024 * 1024); // 转换为 MB

  // 验证文件类型
  if (fileType !== "application/pdf") {
    showError(`${file.name} 不是一个有效的 PDF 文件！`);
    return false;
  }

  // 验证文件大小
  if (fileSize > 495) {
    showError(`${file.name} 文件大小超过了 495MB 的限制！`);
    return false;
  }

  return true; // 文件通过校验
}

function getToEnd(node, parents = []) {
  if (node.hasChildNodes()) {
    return getToEnd(node.firstChild, [node, ...parents])
  } else {
    return [node, ...parents]
  }
}

function showError(message) {
  errorDialog.value = true
  errorMessage.value = message
}

function addWrappedText({
                          text,
                          doc,
                          fontSize = 10,
                          xPosition = 10,
                          initialYPosition = 10,

                        }) {
  doc.setFontSize(fontSize);
  const textLines = doc.splitTextToSize(text, doc.internal.pageSize.width - 20); // Split the text into lines
  const pageHeight = doc.internal.pageSize.height - yMargin;        // Get page height, we'll use this for auto-paging. TRANSLATE this line if using units other than `pt`
  let cursorY = initialYPosition;
  const lineSpacing = fontSize * 0.55;
  textLines.forEach(lineText => {
    if (cursorY > pageHeight) { // Auto-paging
      doc.addPage();
      cursorY = yMargin;
    }
    doc.text(xPosition, cursorY, lineText);
    cursorY += lineSpacing;
  })
  return cursorY
}

</script>
<style>


div#wave {
  position: relative;
  text-align: center;
  margin-left: 2px;

  .dot {
    display: inline-block;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    margin-right: 3px;
    background: #303131;
    animation: wave 1.3s linear infinite;

    &:nth-child(2) {
      animation-delay: -1.1s;
    }

    &:nth-child(3) {
      animation-delay: -0.9s;
    }
  }
}

@keyframes wave {
  0%, 60%, 100% {
    transform: initial;
  }

  30% {
    transform: translateY(-2px);
  }
}

.drag-overlay {
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  width: 100vw;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.7);
  z-index: 9999;
}

.drag-overlay-content {
  text-align: center;
  color: #fff;
  user-select: none;
}


</style>
