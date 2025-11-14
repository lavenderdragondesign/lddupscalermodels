import { createApp } from "vue";
import App from "./App.vue";

import "@tensorflow/tfjs-backend-webgl";
import * as tf from "@tensorflow/tfjs";

async function initTF() {
  // Force WebGL backend for maximum compatibility on Windows / browsers
  await tf.setBackend("webgl");
  await tf.ready();
  console.log("Using WebGL backend");
}

initTF().then(() => {
  const app = createApp(App);
  app.mount("#app");
});
