<template>
  <div class="preview">
    <div class="pane">
      <div class="label">Original</div>
      <div class="image-box">
        <img v-if="inputUrl" :src="inputUrl" alt="Input" />
        <span v-else class="placeholder">No image</span>
      </div>
    </div>

    <div class="pane">
      <div class="label">Upscaled</div>
      <div class="image-box">
        <img v-if="outputUrl" :src="outputUrl" alt="Output" />
        <span v-else class="placeholder">Run the upscaler to see result</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  inputUrl: string | null;
  outputUrl: string | null;
}>();
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
  gap: 6px;
}
.label {
  font-size: 12px;
  font-weight: 600;
  color: #e5e7eb;
}
.image-box {
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.4);
  background: radial-gradient(circle at top left, #020617, #020617 55%, #030712 100%);
  min-height: 220px;
  overflow: auto;
  display: flex;
  align-items: center;
  justify-content: center;
}
.image-box img {
  max-width: 100%;
}
.placeholder {
  font-size: 12px;
  opacity: 0.7;
  color: #9ca3af;
}
@media (max-width: 900px) {
  .preview {
    grid-template-columns: 1fr;
  }
}
</style>
