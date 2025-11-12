<template>
  <div class="preview">
    <div v-if="inputUrl && outputUrl" class="compare-wrapper">
      <div class="compare-inner">
        <img :src="inputUrl" alt="Original" class="img base" />
        <div class="img-overlay" :style="{ width: slider + '%' }">
          <img :src="outputUrl" alt="Upscaled" class="img top" />
        </div>
        <div class="handle" :style="{ left: slider + '%' }"></div>
        <div class="label label-left">Original</div>
        <div class="label label-right">Upscaled</div>
      </div>
      <input type="range" min="0" max="100" v-model.number="slider" class="slider" />
      <div class="actions">
        <button type="button" class="download-btn" @click="download" :disabled="!outputUrl">
          Download upscaled PNG
        </button>
      </div>
    </div>

    <div v-else class="empty">
      <p class="empty-title">No comparison yet</p>
      <p class="empty-subtitle">Load an image and run the upscaler to see the before/after slider.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const props = defineProps<{
  inputUrl: string | null;
  outputUrl: string | null;
}>();

const slider = ref(50);

function download() {
  if (!props.outputUrl) return;
  const a = document.createElement("a");
  a.href = props.outputUrl;
  a.download = "ldd-upscaled.png";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
</script>

<style scoped>
.preview {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.compare-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.compare-inner {
  position: relative;
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.4);
  background: radial-gradient(circle at top left, #020617, #020617 55%, #030712 100%);
  min-height: 240px;
  overflow: hidden;
}

.img {
  display: block;
  max-width: 100%;
  height: auto;
}

.base {
  position: relative;
  z-index: 1;
}

.img-overlay {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  overflow: hidden;
  z-index: 2;
}

.img-overlay .top {
  height: 100%;
  width: auto;
}

.handle {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #e5e7eb;
  z-index: 3;
  transform: translateX(-1px);
}

.label {
  position: absolute;
  top: 8px;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  background: rgba(15, 23, 42, 0.85);
  color: #e5e7eb;
  z-index: 4;
}

.label-left {
  left: 8px;
}

.label-right {
  right: 8px;
}

.slider {
  width: 100%;
}

.actions {
  display: flex;
  justify-content: flex-end;
}

.download-btn {
  padding: 6px 14px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.7);
  background: #020617;
  color: #e5e7eb;
  font-size: 12px;
  cursor: pointer;
}
.download-btn:disabled {
  opacity: 0.5;
  cursor: default;
}

.empty {
  border-radius: 12px;
  border: 1px dashed rgba(148, 163, 184, 0.6);
  padding: 20px;
  text-align: center;
  background: radial-gradient(circle at top left, rgba(15, 23, 42, 0.9), rgba(15, 23, 42, 0.8));
}
.empty-title {
  font-size: 14px;
  font-weight: 600;
  color: #e5e7eb;
}
.empty-subtitle {
  font-size: 12px;
  opacity: 0.7;
  color: #9ca3af;
}
</style>
