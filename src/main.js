/**
 * main.js
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Plugins
import {registerPlugins} from '@/plugins'
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.mjs?url";
// Components
import App from './App.vue'

// Composables
import {createApp} from 'vue'
import hillo from "hillo";

const app = createApp(App)
hillo.use({
  LoadingUtils: {
    showError(e) {
      console.log(e)
    }
  }
})

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
registerPlugins(app)

app.mount('#app')
