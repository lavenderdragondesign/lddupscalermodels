import { createApp } from "vue";
import App from "./App.vue";

import "@tensorflow/tfjs-backend-webgl";
import "@tensorflow/tfjs-backend-webgpu";
import * as tf from "@tensorflow/tfjs";

async function initTF() {
  try {
    // Try WebGPU first
    // @ts-ignore
    await tf.setBackend("webgpu");
    await tf.ready();
    console.log("Using WebGPU backend");
  } catch (e) {
    console.warn("WebGPU backend failed, falling back to WebGL", e);
    await tf.setBackend("webgl");
    await tf.ready();
    console.log("Using WebGL backend");
  }
}

initTF().then(() => {
  const app = createApp(App);
  app.mount("#app");
});
