<template>
  <div class="splash">
    <div class="card">
      <img src="/ldd-logo.png" alt="LDD" class="logo" />
      <div class="title">LavenderDragonDesign Tools</div>
      <div class="subtitle">Initializing Upscaler Engine…</div>
      <div class="bar">
        <div class="fill"></div>
      </div>
      <div class="small">Loading models & backends…</div>
    </div>
  </div>
</template>

<style scoped>
.splash {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at top, #e9d5ff 0, #ffffff 50%, #cffafe 100%);
}
.card {
  background: white;
  padding: 24px 32px;
  border-radius: 24px;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.15);
  text-align: center;
}
.logo {
  width: 80px;
  height: 80px;
  border-radius: 999px;
  margin-bottom: 16px;
}
.title {
  font-size: 20px;
  font-weight: 700;
}
.subtitle {
  font-size: 14px;
  margin-top: 4px;
  opacity: 0.7;
}
.bar {
  margin-top: 18px;
  width: 260px;
  max-width: 100%;
  height: 6px;
  border-radius: 999px;
  background: #e5e7eb;
  overflow: hidden;
}
.fill {
  width: 60%;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #a855f7, #22c55e, #0ea5e9);
  animation: shimmer 1.2s infinite;
}
.small {
  margin-top: 8px;
  font-size: 12px;
  opacity: 0.7;
}
@keyframes shimmer {
  0% {
    transform: translateX(-60%);
  }
  100% {
    transform: translateX(160%);
  }
}
</style>
