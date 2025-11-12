<template>
  <div class="panel">
    <ModelSelector :modelKey="modelKey" @update:modelKey="$emit('update:modelKey', $event)" />

    <div class="grid">
      <label>
        Scale
        <select :value="scale" @change="$emit('update:scale', Number(($event.target as HTMLSelectElement).value))">
          <option :value="2">2x</option>
          <option :value="4">4x</option>
        </select>
      </label>

      <label>
        Tile size
        <input
          type="number"
          min="128"
          max="1024"
          step="64"
          :value="tileSize"
          @input="$emit('update:tileSize', Number(($event.target as HTMLInputElement).value))"
        />
      </label>

      <label>
        Overlap
        <input
          type="number"
          min="0"
          max="64"
          step="4"
          :value="overlap"
          @input="$emit('update:overlap', Number(($event.target as HTMLInputElement).value))"
        />
      </label>
    </div>

    <div class="progress-row">
      <button class="btn" type="button" @click="$emit('upscale')" :disabled="busy">
        <span v-if="busy">Upscaling…</span>
        <span v-else>Upscale</span>
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
  backend: "webgl" | "webgpu";
  scale: number;
  tileSize: number;
  overlap: number;
  busy: boolean;
  progress: number;
}>();

defineEmits<{
  "update:modelKey": [string];
  "update:backend": ["webgl" | "webgpu"];
  "update:scale": [number];
  "update:tileSize": [number];
  "update:overlap": [number];
  upscale: [];
}>();
</script>

<style scoped>
.panel {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}
label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
}
select,
input[type="number"] {
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  padding: 4px 6px;
  font-size: 12px;
}
.btn {
  padding: 8px 18px;
  border-radius: 999px;
  border: none;
  background: linear-gradient(90deg, #a855f7, #22c55e);
  color: white;
  font-size: 13px;
  cursor: pointer;
}
.btn:disabled {
  opacity: 0.6;
  cursor: default;
}
.progress-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
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
