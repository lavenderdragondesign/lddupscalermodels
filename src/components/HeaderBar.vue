<template>
  <header class="header">
    <div class="left">
      <img src="/ldd-logo.png" class="logo" alt="LDD" />
      <div>
        <div class="title">LavenderDragonDesign Upscaler</div>
        <div class="subtitle">RealESRGAN / RealCUGAN · 100% in your browser</div>
      </div>
    </div>
    <div class="right">
      <a
        href="https://github.com/lavenderdragondesign"
        target="_blank"
        rel="noreferrer"
        class="btn"
      >
        View on GitHub
      </a>
    </div>
  </header>
</template>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 24px 0 24px;
}
.left {
  display: flex;
  gap: 12px;
  align-items: center;
}
.logo {
  width: 42px;
  height: 42px;
  border-radius: 999px;
}
.title {
  font-size: 18px;
  font-weight: 700;
}
.subtitle {
  font-size: 12px;
  opacity: 0.7;
}
.btn {
  font-size: 13px;
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.6);
  text-decoration: none;
  color: #0f172a;
  background: rgba(255, 255, 255, 0.9);
}
.btn:hover {
  background: #e5e7eb;
}
</style>
