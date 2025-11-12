<template>
  <div class="panel">
    <ModelSelector :modelKey="modelKey" @update:modelKey="$emit('update:modelKey', $event)" />

    <div class="hint">
      Engines are tuned for different images. Hover each option for tips on when to use it.
    </div>

    <div class="progress-row">
      <button class="btn" type="button" @click="$emit('upscale')" :disabled="busy">
        <span v-if="busy">Upscaling…</span>
        <span v-else>Upscale image</span>
      </button>

      <div v-if="busy" class="progress">
        <div class="bar">
          <div class="fill" :style="{ width: progress + '%' }"></div>
        </div>
        <span class="label">{{ progress.toFixed(0) }}%</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ModelSelector from "./ModelSelector.vue";

defineProps<{
  modelKey: string;
  busy: boolean;
  progress: number;
}>();

defineEmits<{
  "update:modelKey": [string];
  upscale: [];
}>();
</script>

<style scoped>
.panel {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.hint {
  font-size: 11px;
  opacity: 0.7;
}
.progress-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 6px;
}
.btn {
  padding: 8px 18px;
  border-radius: 999px;
  border: none;
  background: linear-gradient(90deg, #a855f7, #22c55e);
  color: white;
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
}
.btn:disabled {
  opacity: 0.6;
  cursor: default;
}
.progress {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
}
.bar {
  flex: 1;
  height: 6px;
  border-radius: 999px;
  background: #e5e7eb;
}
.fill {
  height: 100%;
  background: linear-gradient(90deg, #a855f7, #0ea5e9);
  border-radius: inherit;
}
.label {
  font-size: 11px;
  opacity: 0.8;
}
</style>
