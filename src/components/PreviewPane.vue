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
}
.image-box {
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
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
}
@media (max-width: 900px) {
  .preview {
    grid-template-columns: 1fr;
  }
}
</style>
