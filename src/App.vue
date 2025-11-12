<template>
  <Splash v-if="loading" />

  <div v-else class="app">
    <HeaderBar />

    <main class="layout">
      <section class="left">
        <ImageDropzone
          :file="file"
          @file-change="onFileChange"
          :busy="busy"
        />

        <ControlsPanel
          :modelKey="modelKey"
          :backend="backend"
          :scale="scale"
          :tileSize="tileSize"
          :overlap="overlap"
          @update:modelKey="val => (modelKey = val)"
          @update:backend="val => (backend = val)"
          @update:scale="val => (scale = val)"
          @update:tileSize="val => (tileSize = val)"
          @update:overlap="val => (overlap = val)"
          @upscale="handleUpscale"
          :busy="busy"
          :progress="progress"
        />
      </section>

      <section class="right">
        <PreviewPane :inputUrl="inputUrl" :outputUrl="outputUrl" />
      </section>
    </main>

    <footer class="footer">
      LavenderDragonDesign · 100% client-side · MIT
    </footer>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import Splash from "./components/Splash.vue";
import HeaderBar from "./components/HeaderBar.vue";
import ImageDropzone from "./components/ImageDropzone.vue";
import ControlsPanel from "./components/ControlsPanel.vue";
import PreviewPane from "./components/PreviewPane.vue";
import { upscaleImage } from "./utils/upscaler";

const loading = ref(true);

const file = ref<File | null>(null);
const inputUrl = ref<string | null>(null);
const outputUrl = ref<string | null>(null);

const modelKey = ref("realesrgan/general_plus-64");
const backend = ref<"webgl" | "webgpu">("webgl");
const scale = ref(4);
const tileSize = ref(256);
const overlap = ref(16);

const busy = ref(false);
const progress = ref(0);

onMounted(() => {
  setTimeout(() => (loading.value = false), 1200);
});

function onFileChange(newFile: File | null) {
  file.value = newFile;
  outputUrl.value = null;

  if (newFile) {
    inputUrl.value = URL.createObjectURL(newFile);
  } else {
    inputUrl.value = null;
  }
}

async function handleUpscale() {
  if (!file.value || !inputUrl.value) return;

  busy.value = true;
  progress.value = 0;

  try {
    const blob = await upscaleImage({
      file: file.value,
      modelKey: modelKey.value,
      scale: scale.value,
      tileSize: tileSize.value,
      overlap: overlap.value,
      onProgress: p => (progress.value = p)
    });

    if (outputUrl.value) {
      URL.revokeObjectURL(outputUrl.value);
    }

    outputUrl.value = URL.createObjectURL(blob);
  } catch (err) {
    console.error(err);
    alert("Upscale failed. Check console for details.");
  } finally {
    busy.value = false;
    progress.value = 0;
  }
}
</script>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: radial-gradient(circle at top left, #d3c4ff 0, #ffffff 40%, #c7f5ff 100%);
  color: #111827;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
.layout {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 1.1fr);
  gap: 20px;
  padding: 24px;
}
.left,
.right {
  background: rgba(255, 255, 255, 0.85);
  border-radius: 18px;
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.12);
  padding: 16px;
  backdrop-filter: blur(18px);
}
.footer {
  text-align: center;
  font-size: 12px;
  padding: 12px;
  opacity: 0.7;
}
@media (max-width: 900px) {
  .layout {
    grid-template-columns: 1fr;
  }
}
</style>
