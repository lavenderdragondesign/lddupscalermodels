<template>
  <div class="panel">
    <div class="engine-grid">
      <button
        v-for="engine in engines"
        :key="engine.key"
        type="button"
        class="engine-btn"
        :class="{ 'engine-btn--active': engine.key === modelKey }"
        @click="$emit('update:modelKey', engine.key)"
      >
        <div v-if="engine.recommended" class="engine-rec">⭐ Recommended</div>

        <div class="engine-main">
          <div class="engine-name">{{ engine.name }}</div>
          <div class="engine-tagline">{{ engine.tagline }}</div>
        </div>
        <div class="engine-family">{{ engine.family }}</div>

        <div class="hover-card">
          <div class="hover-title">{{ engine.name }}</div>
          <p class="hover-body">
            {{ engine.description }}
          </p>
        </div>
      </button>
    </div>

    <div class="progress-row">
      <button class="btn" type="button" @click="$emit('upscale')" :disabled="busy">
        <span v-if="busy">Upscaling…</span>
        <span v-else>Upscale image</span>
      </button>

      <div v-if="busy" class="progress progress--spinner">
        <div class="spinner">
          <div class="spinner-glow"></div>
          <img :src="logoURL" alt="LavenderDragonDesign logo" class="spinner-logo" />
        </div>
        <span class="percent">{{ progress.toFixed(0) }}%</span>
        <span v-if="etaText" class="eta">~{{ etaText }} left</span>
      </div>
    </div>
  </div>
</template>



<script setup lang="ts">
const props = defineProps<{
  modelKey: string;
  busy: boolean;
  progress: number;
  etaText: string | null;
}>();

defineEmits<{
  "update:modelKey": [string];
  upscale: [];
}>();

const logoURL = "https://i.postimg.cc/y6M6KPZ5/logo.jpg";

const engines = [
  {
    key: "realesrgan/general_fast-64",
    name: "LDD Crystal Standard",
    family: "Photo / General",
    tagline: "Fast, clean upscales for everyday images.",
    description: "Use this for most photos, textures, and product shots when you want a good balance between speed and quality."
  },
  {
    key: "realesrgan/general_plus-64",
    name: "LDD Crystal HD",
    recommended: true,
    family: "Photo / Print",
    tagline: "Highest-quality engine for photos and print.",
    description: "Best choice for Etsy listings, product photos, and anything going to print. Slower, but sharper and cleaner."
  },
  {
    key: "realesrgan/anime_fast-64",
    name: "LDD Crystal Linework",
    family: "Cartoons / Stickers",
    tagline: "Tuned for flat colors and clean lines.",
    description: "Great for kawaii stickers, cartoons, emojis, and simple flat-color illustrations without heavy textures."
  },
  {
    key: "realesrgan/anime_plus-64",
    name: "LDD Crystal Linework Pro",
    recommended: true,
    family: "Detailed Line Art",
    tagline: "Max clarity for line art and illustration.",
    description: "Use this when your art has a lot of fine lines: manga-style work, detailed doodles, icons, and illustrational assets."
  },
  {
    key: "realcugan/2x-conservative-64",
    name: "LDD Emerald 2× Clean",
    family: "Logos / UI",
    tagline: "Cleans jagged edges at 2×.",
    description: "Ideal for logos, UI icons, and small digital graphics that need smoother edges without looking overly sharpened."
  },
  {
    key: "realcugan/4x-conservative-64",
    name: "LDD Emerald 4× Clean",
    family: "Assets / Game Art",
    tagline: "4× upscale for clean digital assets.",
    description: "Perfect for app assets, game sprites, and other clean digital artwork where you want a big resolution jump."
  }
];
</script>

<style scoped>
.engine-rec {
  position: absolute;
  top: 6px;
  right: 6px;
  font-size: 9px;
  background: rgba(34,197,94,0.2);
  color: #bbf7d0;
  padding: 2px 6px;
  border-radius: 999px;
  border: 1px solid rgba(34,197,94,0.6);
}
.engine-btn {
  position: relative;
}

.panel {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.engine-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.engine-btn {
  position: relative;
  text-align: left;
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.55);
  padding: 10px 12px;
  background: radial-gradient(circle at top left, rgba(15, 23, 42, 0.95), rgba(15, 23, 42, 0.9));
  color: #e5e7eb;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow: visible;
}

.engine-btn--active {
  border-color: #a855f7;
  box-shadow: 0 0 0 1px rgba(168, 85, 247, 0.6), 0 18px 40px rgba(0, 0, 0, 0.7);
}

.engine-main {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.engine-name {
  font-size: 13px;
  font-weight: 600;
}

.engine-tagline {
  font-size: 11px;
  opacity: 0.8;
}

.engine-family {
  font-size: 11px;
  color: #a5b4fc;
  margin-top: 4px;
}

.hover-card {
  position: absolute;
  top: 50%;
  left: 100%;
  transform: translate(10px, -50%);
  width: 240px;
  padding: 10px 12px;
  border-radius: 14px;
  background: #ffffff;
  color: #0f172a;
  box-shadow: 0 18px 50px rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.5);
  font-size: 12px;
  line-height: 1.4;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s ease-out, transform 0.15s ease-out;
  z-index: 20;
}

.hover-title {
  font-weight: 600;
  margin-bottom: 4px;
}

.hover-body {
  margin: 0;
}

.engine-btn:hover .hover-card {
  opacity: 1;
  transform: translate(14px, -50%);
}

.progress-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 4px;
}

.btn {
  padding: 10px 26px;
  border-radius: 999px;
  border: none;
  background: #a855f7;
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  box-shadow: 0 16px 40px rgba(88, 28, 135, 0.6);
}

.btn:disabled {
  opacity: 0.6;
  cursor: default;
}

.progress {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  justify-content: flex-end;
}

.progress--spinner {
  justify-content: flex-end;
}

.spinner {
  position: relative;
  width: 42px;
  height: 42px;
  border-radius: 999px;
  overflow: hidden;
}

.spinner-logo {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 999px;
  animation: spinner-rotate 1.2s linear infinite;
}

.spinner-glow {
  position: absolute;
  inset: 0;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(168, 85, 247, 0.35), transparent 60%);
  box-shadow: 0 0 18px rgba(168, 85, 247, 0.9);
  animation: spinner-pulse 1.4s ease-in-out infinite;
}

.spinner {
  position: relative;
  width: 42px;
  height: 42px;
  border-radius: 999px;
  overflow: hidden;
}

.spinner-logo {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 999px;
  animation: spinner-rotate 1.2s linear infinite;
}

.spinner-glow {
  position: absolute;
  inset: 0;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(168, 85, 247, 0.35), transparent 60%);
  box-shadow: 0 0 18px rgba(168, 85, 247, 0.9);
  animation: spinner-pulse 1.4s ease-in-out infinite;
}

.spinner {
  position: relative;
  width: 42px;
  height: 42px;
  border-radius: 999px;
  overflow: hidden;
}

.spinner-logo {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 999px;
  animation: spinner-rotate 1.2s linear infinite;
}

.spinner-glow {
  position: absolute;
  inset: 0;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(168, 85, 247, 0.35), transparent 60%);
  box-shadow: 0 0 18px rgba(168, 85, 247, 0.9);
  animation: spinner-pulse 1.4s ease-in-out infinite;
}

.percent {
  font-size: 15px;
  font-weight: 600;
}

@keyframes spinner-rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes spinner-pulse {
  0% {
    transform: scale(0.9);
    opacity: 0.7;
  }
  50% {
    transform: scale(1.05);
    opacity: 1;
  }
  100% {
    transform: scale(0.9);
    opacity: 0.7;
  }
}


@media (max-width: 900px) {
  .engine-grid {
    grid-template-columns: 1fr;
  }
}
</style>