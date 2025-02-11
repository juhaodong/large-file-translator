import {Remember} from "@/plugins/supabase.js";
import markdownit from "markdown-it";
import {defineStore} from 'pinia'
import {getFileDetailByFileHash} from "@/dataLayer/cloudApi.js";
import {markdownItTable} from "markdown-it-table";

export const useInfoDisplayStore = defineStore('infoDisplayStore', () => {
  const fileInfo = ref(null)
  const fileHash = ref(Remember.currentFileHash)
  let imageDic = {}
  const md = markdownit({
    linkify: true,
    breaks: true,
    typographer: true,
    html: true
  })
  md.use(markdownItTable)
  const defaultImageRenderer = md.renderer.rules.image

  md.renderer.rules.image = (tokens, idx, options, env, self) => {
    const src = tokens[idx].attrGet('src')
    if (src.startsWith('_')) {
      const base64 = imageDic?.[src]
      if (base64) {
        tokens[idx].attrSet('src', "data:image/jpg;base64," + base64)
        tokens[idx].attrSet('style', "max-width:100%;")
      }
    }
    return defaultImageRenderer(tokens, idx, options, env, self)
  };
  const fileInfoLoading = ref(true)

  const displayParagraph = computed(() => {
    return fileInfo.value?.document ?? []

  })
  const docName = computed(() => {
    return fileInfo.value.fileName
  })
  const pageCount = computed(() => {
    return fileInfo.value?.pagesCount ?? '-'
  })
  const fileStatus = computed(() => {
    return fileInfo.value.status ?? 'Not Exist'
  })
  const progressConsole = computed(() => {
    return (fileInfo.value.console ?? "").split('\n').slice().reverse();
  })

  function renderMarkdown(markdownText) {
    return md.render(markdownText)
  }

  async function loadCurrentFileInfo() {
    fileInfoLoading.value = true
    if (fileHash.value) {
      await loadIfShouldLoad()
      imageDic = fileInfo.value?.analysisResult?.images
    }

    fileInfoLoading.value = false
  }


  async function loadIfShouldLoad() {
    fileInfo.value = await getFileDetailByFileHash(fileHash.value)
    if (fileInfo.value && fileStatus.value !== 'Done' && fileHash.value) {
      setTimeout(loadIfShouldLoad, 30 * 1000)
    }

  }

  async function onFileHashChange(newFileHash) {
    fileHash.value = newFileHash

    if (newFileHash) {
      Remember.currentFileHash = newFileHash
      await loadCurrentFileInfo()

    } else {
      fileInfo.value = null
    }

  }

  return {
    pageCount,
    fileInfo,
    fileHash,
    fileInfoLoading,
    displayParagraph,
    fileStatus,
    imageDic,
    docName,
    progressConsole,
    onFileHashChange,
    renderMarkdown,
    loadCurrentFileInfo,
  }
})
