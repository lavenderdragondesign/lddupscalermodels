<template>
  <Splash v-if="loading" />

  <div v-else class="app">
    <div class="shell">
      <header class="hero">
        <div class="hero-left">
          <div class="pill">LavenderDragonDesign · Browser Upscaler</div>
          <h1>Sharpen your art without leaving the browser.</h1>
          <p>
            Pick an LDD Crystal or Emerald engine, drop in your image, and get
            upscale-ready files for Etsy, POD, and print in seconds.
          </p>
        </div>
        <div class="hero-right">
          <div class="stat-card">
            <div class="stat-value">100%</div>
            <div class="stat-label">Client-side</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">4×</div>
            <div class="stat-label">Max upscale</div>
          </div>
        </div>
      </header>

      <main class="layout">
        <section class="left">
          <div class="card-header">
            <h2>1. Load your image</h2>
            <span>PNG / JPG · Up to a few thousand pixels is fine.</span>
          </div>

          <ImageDropzone
            :file="file"
            @file-change="onFileChange"
            :busy="busy"
          />

          <div class="card-header card-header--spacing">
            <h2>2. Choose an engine</h2>
            <span>Each engine is tuned for a different type of image.</span>
          </div>

          <ControlsPanel
            :modelKey="modelKey"
            :busy="busy"
            :progress="progress"
            @update:modelKey="val => (modelKey = val)"
            @upscale="handleUpscale"
          />
        </section>

        <section class="right">
          <div class="card-header">
            <h2>3. Compare before & after</h2>
            <span>Zoom in to inspect linework, edges, and small text.</span>
          </div>
          <PreviewPane :inputUrl="inputUrl" :outputUrl="outputUrl" />
        </section>
      </main>

      <footer class="footer">
        LavenderDragonDesign · Built for Etsy & POD workflows · MIT Licensed
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import Splash from "./components/Splash.vue";
import ImageDropzone from "./components/ImageDropzone.vue";
import ControlsPanel from "./components/ControlsPanel.vue";
import PreviewPane from "./components/PreviewPane.vue";
import { upscaleImage } from "./utils/upscaler";

const loading = ref(true);

const file = ref<File | null>(null);
const inputUrl = ref<string | null>(null);
const outputUrl = ref<string | null>(null);

const modelKey = ref("realesrgan/general_plus-64");

const busy = ref(false);
const progress = ref(0);

onMounted(() => {
  try {
    const seen = window.localStorage.getItem("ldd-upscaler-splash-seen");
    if (seen === "1") {
      loading.value = false;
      return;
    }
  } catch (e) {
    // ignore, just fall back to showing splash once
  }

  setTimeout(() => {
    loading.value = false;
    try {
      window.localStorage.setItem("ldd-upscaler-splash-seen", "1");
    } catch (e) {
      // ignore
    }
  }, 6000);
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
      scale: 4,
      tileSize: 64,
      overlap: 0,
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
  justify-content: center;
  background:
    radial-gradient(circle at top left, #060816 0, transparent 55%),
    radial-gradient(circle at bottom right, #022c22 0, #020617 45%);
  color: #e5e7eb;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.shell {
  width: 100%;
  max-width: 1120px;
  margin: 0 auto;
  padding: 20px 16px 28px;
}

/* HERO */

.hero {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  padding: 4px 4px 16px;
}

.hero-left h1 {
  font-size: 26px;
  font-weight: 700;
  margin: 8px 0 6px;
  color: #f9fafb;
}

.hero-left p {
  font-size: 14px;
  max-width: 520px;
  opacity: 0.8;
}

.pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  background: rgba(147, 51, 234, 0.22);
  color: #e9d5ff;
  border: 1px solid rgba(129, 140, 248, 0.6);
}

.hero-right {
  display: flex;
  gap: 12px;
  align-items: center;
}

.stat-card {
  background: radial-gradient(circle at top left, #1f2937 0, #020617 75%);
  border-radius: 18px;
  padding: 10px 14px;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.65);
  text-align: center;
  min-width: 80px;
  border: 1px solid rgba(148, 163, 184, 0.4);
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: #e5e7eb;
}

.stat-label {
  font-size: 11px;
  opacity: 0.75;
}

/* MAIN LAYOUT */

.layout {
  display: grid;
  grid-template-columns: minmax(0, 1.02fr) minmax(0, 1.02fr);
  gap: 16px;
}

.left,
.right {
  background: radial-gradient(circle at top left, rgba(15, 23, 42, 0.96), rgba(15, 23, 42, 0.88));
  border-radius: 20px;
  box-shadow: 0 22px 55px rgba(0, 0, 0, 0.8);
  padding: 16px 16px 18px;
  backdrop-filter: blur(20px);
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: relative;
  border: 1px solid rgba(30, 64, 175, 0.6);
}

.card-header {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.card-header h2 {
  font-size: 14px;
  font-weight: 600;
  color: #f9fafb;
}
.card-header span {
  font-size: 11px;
  opacity: 0.7;
  color: #cbd5f5;
}
.card-header--spacing {
  margin-top: 8px;
}

/* FOOTER */

.footer {
  text-align: center;
  font-size: 12px;
  padding: 14px 4px 0;
  opacity: 0.7;
  color: #9ca3af;
}



.left {
  z-index: 2;
}

.right {
  z-index: 1;
}

@media (max-width: 900px) {
  .hero {
    flex-direction: column;
  }
  .layout {
    grid-template-columns: 1fr;
  }
  .hero-right {
    justify-content: flex-start;
  }
}
</style>
