<template>
  <div class="preview">
    <section class="pane single">
      <div class="pane-header">
        <span class="pill-label">Before / After</span>
        <span class="hint" v-if="inputUrl && outputUrl">Drag the handle to compare</span>
      </div>

      <!-- Full comparison slider when we have both images -->
      <div v-if="inputUrl && outputUrl" class="compare-shell">
        <div class="compare-frame">
          <div class="zoom-layer">
            <!-- Upscaled image as the base -->
            <img :src="outputUrl" alt="Upscaled image" class="img-base" />

            <!-- Original image clipped to slider position -->
            <div
              class="img-overlay"
              :style="{
                clipPath: `inset(0 ${(100 - sliderPos).toFixed(1)}% 0 0)`
              }"
            >
              <img :src="inputUrl" alt="Original image" />
            </div>
          </div>

          <!-- Labels -->
          <div class="tag tag-left">Before</div>
          <div class="tag tag-right">After</div>

          <!-- Slider handle -->
          <div class="divider" :style="{ left: sliderPos + '%' }">
            <div class="divider-line"></div>
            <div class="handle">
              <span>←→</span>
            </div>
          </div>

          <!-- Range input controls the divider -->
          <input
            v-model="sliderPos"
            type="range"
            min="0"
            max="100"
            class="range"
          />
        </div>
      </div>

      <!-- Single before preview as soon as an image is loaded -->
      <div v-else-if="inputUrl && !outputUrl" class="single-shell">
        <div class="single-frame">
          <img :src="inputUrl" alt="Original image" class="single-img" />
          <div class="single-tag">Before</div>
        </div>
        <p class="single-hint">Run the upscaler to see the after view.</p>
      </div>

      <!-- No image yet -->
      <div v-else class="empty-state">
        <p>Load an image on the left to begin.</p>
      </div>


    </section>
  </div>
</template>



<script setup lang="ts">
import { ref } from "vue";

const props = defineProps<{
  inputUrl: string | null;
  outputUrl: string | null;
}>();

const sliderPos = ref(50);

</script>

<style scoped>
.preview {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.pane.single {
  background: radial-gradient(circle at top left, rgba(168, 85, 247, 0.2), transparent 55%),
    radial-gradient(circle at bottom right, rgba(34, 197, 94, 0.16), transparent 55%),
    #020617;
  border-radius: 22px;
  border: 1px solid rgba(148, 163, 184, 0.4);
  padding: 18px 18px 20px;
  box-shadow: 0 24px 80px rgba(15, 23, 42, 0.9);
  position: relative;
  overflow: hidden;
}

.pane-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.pill-label {
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 3px 9px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.6);
  color: #e5e7eb;
  background: rgba(15, 23, 42, 0.85);
}

.hint {
  font-size: 11px;
  color: rgba(209, 213, 219, 0.75);
}

.compare-shell {
  margin-top: 4px;
}

.single-shell {
  margin-top: 4px;
}

.single-frame {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  border-radius: 18px;
  overflow: hidden;
  background: radial-gradient(circle at center, #020617, #020617 40%, #000 100%);
  border: 1px solid rgba(148, 163, 184, 0.6);
}

.single-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.single-tag {
  position: absolute;
  top: 10px;
  left: 12px;
  padding: 4px 9px;
  font-size: 11px;
  font-weight: 600;
  border-radius: 999px;
  backdrop-filter: blur(10px);
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(148, 163, 184, 0.7);
  color: #e5e7eb;
}

.single-hint {
  margin-top: 6px;
  font-size: 12px;
  color: rgba(209, 213, 219, 0.85);
}

.compare-frame {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  border-radius: 18px;
  overflow: hidden;
  background: radial-gradient(circle at center, #020617, #020617 40%, #000 100%);
  border: 1px solid rgba(148, 163, 184, 0.6);
}

/* Zoom layer for hover effect */
.zoom-layer {
  position: absolute;
  inset: 0;
  transition: transform 0.35s ease-out;
  will-change: transform;
}

.compare-frame:hover .zoom-layer {
  transform: scale(1.06);
}

.img-base,
.img-overlay img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.img-base {
  position: absolute;
  inset: 0;
}

.img-overlay {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  pointer-events: none;
}

.img-overlay img {
  position: absolute;
  inset: 0;
}

.tag {
  position: absolute;
  top: 10px;
  padding: 4px 9px;
  font-size: 11px;
  font-weight: 600;
  border-radius: 999px;
  backdrop-filter: blur(10px);
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(148, 163, 184, 0.7);
  color: #e5e7eb;
}

.tag-left {
  left: 12px;
}

.tag-right {
  right: 12px;
}

.divider {
  position: absolute;
  top: 0;
  bottom: 0;
  transform: translateX(-50%);
  pointer-events: none;
}

.divider-line {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
  background: linear-gradient(
    to bottom,
    rgba(148, 163, 184, 0.1),
    rgba(248, 250, 252, 0.9),
    rgba(148, 163, 184, 0.1)
  );
}

.handle {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 30px;
  height: 30px;
  border-radius: 999px;
  background: radial-gradient(circle at top left, #a855f7, #22c55e 60%, #0ea5e9 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #020617;
  font-size: 16px;
  font-weight: 700;
  box-shadow: 0 0 25px rgba(94, 234, 212, 0.8);
}

.range {
  position: absolute;
  inset: 0;
  appearance: none;
  background: transparent;
  cursor: ew-resize;
  z-index: 5;
}

.range::-webkit-slider-thumb {
  appearance: none;
  width: 40px;
  height: 40px;
  background: transparent;
  cursor: ew-resize;
}

.range::-moz-range-thumb {
  width: 40px;
  height: 40px;
  background: transparent;
  border: none;
  cursor: ew-resize;
}

.empty-state {
  border-radius: 16px;
  border: 1px dashed rgba(148, 163, 184, 0.5);
  padding: 16px;
  margin-top: 6px;
  background: rgba(15, 23, 42, 0.7);
  font-size: 13px;
  color: rgba(209, 213, 219, 0.85);
}

.download-btn {
  margin-top: 14px;
  align-self: flex-start;
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

.download-btn:hover {
  background-position: 100% 0;
}

@keyframes shimmer {
  0% {
    background-position: 0% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

@media (max-width: 900px) {
  .pane.single {
    padding: 14px;
  }
  .compare-frame {
    aspect-ratio: 3 / 4;
  }
}
</style>
