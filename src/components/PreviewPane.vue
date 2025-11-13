<template>
  <div class="preview">
    <section class="pane">
      <div class="label">Original</div>
      <div class="image-box">
        <img v-if="inputUrl" :src="inputUrl" alt="Original image" />
        <span v-else class="placeholder">No image loaded yet</span>
      </div>
    </section>

    <section class="pane">
      <div class="label">Upscaled</div>
      <div class="image-box">
        <img v-if="outputUrl" :src="outputUrl" alt="Upscaled image" />
        <span v-else class="placeholder">Run the upscaler to see your result</span>
      </div>

      <button
        v-if="outputUrl"
        type="button"
        class="download-btn"
        @click="download"
      >
        Download Upscaled PNG (300 DPI Ready)
      </button>
    </section>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  inputUrl: string | null;
  outputUrl: string | null;
}>();

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
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.pane {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.label {
  font-size: 12px;
  font-weight: 600;
  color: #e5e7eb;
}
.image-box {
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.45);
  background: radial-gradient(circle at top left, #020617, #020617 55%, #030712 100%);
  min-height: 220px;
  overflow: auto;
  display: flex;
  align-items: center;
  justify-content: center;
}
.image-box img {
  max-width: 100%;
  height: auto;
  display: block;
}
.placeholder {
  font-size: 12px;
  opacity: 0.7;
  color: #9ca3af;
}
.download-btn {
  margin-top: 10px;
  width: 100%;
  padding: 10px 16px;
  border-radius: 999px;
  border: none;
  font-size: 13px;
  font-weight: 600;
  background: linear-gradient(90deg, #a855f7, #22c55e, #0ea5e9);
  background-size: 200% 100%;
  color: #f9fafb;
  cursor: pointer;
  box-shadow: 0 18px 45px rgba(0, 0, 0, 0.8);
}
@media (max-width: 900px) {
  .preview {
    grid-template-columns: 1fr;
  }
}
</style>
