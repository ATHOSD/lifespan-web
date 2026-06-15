<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">Batch Processing</h1>
      <p class="page-desc">Process multiple MRI scans simultaneously</p>
    </div>

    <div class="coming-card">
      <div class="cs-glow" />
      <div class="cs-icon">
        <svg viewBox="0 0 24 24" fill="none" width="32" height="32">
          <path d="M13 10V3L4 14h7v7l9-11h-7z" stroke="#6366f1" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <h2>Coming Soon</h2>
      <p>Batch processing will allow you to upload and segment multiple MRI scans in a single job, with parallel inference and a downloadable results archive.</p>
      <div class="feature-list">
        <div class="feature-item">
          <span class="feature-dot" />
          Upload multiple .nii.gz files at once
        </div>
        <div class="feature-item">
          <span class="feature-dot" />
          Parallel segmentation with progress tracking
        </div>
        <div class="feature-item">
          <span class="feature-dot" />
          Downloadable ZIP archive with all masks + volume CSV
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-header { margin-bottom: 28px; }
.page-title { font-size: 1.6rem; font-weight: 700; letter-spacing: -0.03em; color: #f1f5f9; }
.page-desc { font-size: 0.875rem; color: #475569; margin-top: 5px; }

.coming-card {
  position: relative;
  background: rgba(12, 22, 44, 0.7);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 16px;
  padding: 64px 48px;
  text-align: center;
  display: flex; flex-direction: column; align-items: center; gap: 16px;
  backdrop-filter: blur(12px);
  overflow: hidden;
}
.cs-glow {
  position: absolute; top: -80px; left: 50%; transform: translateX(-50%);
  width: 300px; height: 300px;
  background: radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%);
  pointer-events: none;
}
.cs-icon {
  width: 64px; height: 64px;
  background: rgba(99,102,241,0.1);
  border: 1px solid rgba(99,102,241,0.2);
  border-radius: 16px;
  display: flex; align-items: center; justify-content: center;
}
.coming-card h2 { font-size: 1.4rem; font-weight: 700; color: #e2e8f0; letter-spacing: -0.02em; }
.coming-card p { font-size: 0.9rem; color: #475569; max-width: 420px; line-height: 1.7; }

.feature-list { display: flex; flex-direction: column; gap: 8px; margin-top: 8px; text-align: left; }
.feature-item {
  display: flex; align-items: center; gap: 10px;
  font-size: 0.845rem; color: #64748b;
  padding: 10px 16px;
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.04);
  border-radius: 9px;
}
.feature-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  flex-shrink: 0;
}
</style>
