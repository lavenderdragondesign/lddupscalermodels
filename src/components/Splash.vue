<script setup lang="ts">
const logoURL = "https://i.postimg.cc/y6M6KPZ5/logo.jpg";
</script>

<template>
  <div class="splash">
    <div class="glow-orb"></div>
    <div class="card">
      <div class="logo-row">
        <img :src="logoURL" alt="LavenderDragonDesign logo" class="logo" />
      </div>
      <div class="badge">LavenderDragonDesign · Upscaler</div>
      <div class="title">Warming up your engines…</div>
      <div class="subtitle">
        Initializing LDD Crystal &amp; Emerald models, WebGPU / WebGL backends,
        and tiling engine.
      </div>

      <div class="engine-row">
        <span class="pill pill-crystal">Crystal engines</span>
        <span class="pill pill-emerald">Emerald engines</span>
      </div>

      <div class="loader">
        <div class="bar">
          <div class="fill"></div>
        </div>
        <div class="hint">Preparing client-side session · No images leave your browser</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.splash {
  position: fixed;
  inset: 0;
  background:
    radial-gradient(circle at top left, #020617 0, #020617 40%, transparent 70%),
    radial-gradient(circle at bottom right, #022c22 0, #020617 45%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  color: #e5e7eb;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.glow-orb {
  position: absolute;
  width: 360px;
  height: 360px;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(147, 51, 234, 0.7), transparent 60%);
  filter: blur(12px);
  opacity: 0.7;
  transform: translate(-10%, -20%);
}

.card {
  position: relative;
  max-width: 480px;
  width: 90%;
  background: radial-gradient(circle at top left, rgba(15, 23, 42, 0.96), rgba(15, 23, 42, 0.9));
  padding: 24px 22px 20px;
  border-radius: 24px;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.85);
  border: 1px solid rgba(129, 140, 248, 0.6);
  backdrop-filter: blur(24px);
}
.logo-row {
  display: flex;
  justify-content: center;
  margin-bottom: 6px;
}

.logo {
  width: 44px;
  height: 44px;
  border-radius: 999px;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.85);
}


.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.5);
  color: #e5e7eb;
}

.title {
  margin-top: 12px;
  font-size: 22px;
  font-weight: 700;
  color: #f9fafb;
}

.subtitle {
  margin-top: 6px;
  font-size: 13px;
  opacity: 0.78;
  line-height: 1.5;
}

.engine-row {
  margin-top: 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.pill {
  font-size: 11px;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid transparent;
}

.pill-crystal {
  background: rgba(147, 51, 234, 0.18);
  border-color: rgba(196, 181, 253, 0.8);
  color: #e9d5ff;
}

.pill-emerald {
  background: rgba(16, 185, 129, 0.12);
  border-color: rgba(45, 212, 191, 0.8);
  color: #bbf7d0;
}

.loader {
  margin-top: 18px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.bar {
  width: 100%;
  height: 6px;
  border-radius: 999px;
  background: rgba(30, 64, 175, 0.4);
  overflow: hidden;
}

.fill {
  height: 100%;
  width: 40%;
  background: linear-gradient(90deg, #a855f7, #22c55e, #0ea5e9);
  background-size: 200% 100%;
  animation: slide 1.4s linear infinite;
}

.hint {
  font-size: 11px;
  opacity: 0.72;
  color: #cbd5f5;
}

@keyframes slide {
  0% { transform: translateX(-100%); }
  50% { transform: translateX(0%); }
  100% { transform: translateX(100%); }
}
</style>
