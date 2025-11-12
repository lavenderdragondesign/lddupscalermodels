<template>
  <div
    class="dropzone"
    :class="{ 'dropzone--busy': busy }"
    @dragover.prevent
    @dragenter.prevent
    @drop.prevent="handleDrop"
  >
    <div v-if="!file">
      <p class="title">Drop an image here</p>
      <p class="subtitle">or click to browse</p>
      <input
        type="file"
        accept="image/*"
        class="input"
        @change="handleChange"
      />
    </div>

    <div v-else class="file-info">
      <p class="title">{{ file.name }}</p>
      <p class="subtitle">{{ prettySize }}</p>
      <button class="clear" type="button" @click="clear" :disabled="busy">
        Remove
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineEmits, defineProps } from "vue";

const props = defineProps<{
  file: File | null;
  busy: boolean;
}>();

const emit = defineEmits<{
  "file-change": [file: File | null];
}>();

const prettySize = computed(() => {
  if (!props.file) return "";
  const size = props.file.size;
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(2)} MB`;
});

function handleDrop(e: DragEvent) {
  if (props.busy) return;
  const files = e.dataTransfer?.files;
  if (!files || !files[0]) return;
  emit("file-change", files[0]);
}

function handleChange(e: Event) {
  if (props.busy) return;
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0] ?? null;
  emit("file-change", file);
}

function clear() {
  emit("file-change", null);
}
</script>

<style scoped>
.dropzone {
  border-radius: 14px;
  border: 1px dashed rgba(148, 163, 184, 0.7);
  padding: 16px;
  text-align: center;
  background: radial-gradient(circle at top left, rgba(15, 23, 42, 0.9), rgba(15, 23, 42, 0.8));
  position: relative;
  color: #e5e7eb;
}
.dropzone--busy {
  opacity: 0.5;
  pointer-events: none;
}
.input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}
.title {
  font-weight: 600;
}
.subtitle {
  font-size: 12px;
  opacity: 0.7;
}
.file-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
}
.clear {
  padding: 4px 10px;
  font-size: 12px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.7);
  background: #020617;
  color: #e5e7eb;
}
.clear:hover {
  background: #0f172a;
}
</style>
