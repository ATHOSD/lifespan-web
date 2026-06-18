<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">Growth Curve</h1>
      <p class="page-desc">Visualize brain development trajectories across subjects</p>
    </div>

    <div class="empty-card">
      <div class="empty-icon">
        <svg viewBox="0 0 48 48" fill="none" width="48" height="48">
          <path d="M4 38L14 26l10 7L34 15l10-7" stroke="#d6d3cd" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="14" cy="26" r="2.5" fill="#d6d3cd"/>
          <circle cx="24" cy="33" r="2.5" fill="#d6d3cd"/>
          <circle cx="34" cy="15" r="2.5" fill="#d6d3cd"/>
        </svg>
      </div>
      <p class="empty-title">No data yet</p>
      <p class="empty-hint">Use <strong>Add to Curve</strong> on segmentation results to add subjects here.</p>
    </div>
  </div>
</template>

<style scoped>
.page-header { margin-bottom: 28px; }
.page-title { font-size: 1.75rem; font-weight: 700; letter-spacing: -0.03em; color: #1c1917; }
.page-desc { font-size: 1rem; color: #a8a29e; margin-top: 5px; }

.empty-card {
  background: #ffffff; border: 1px solid #e8e4dc;
  border-radius: 16px; padding: 80px 40px;
  display: flex; flex-direction: column; align-items: center; gap: 12px;
  box-shadow: 0 1px 4px rgba(28,25,23,0.05);
  text-align: center;
}
.empty-icon { opacity: 0.6; margin-bottom: 4px; }
.empty-title { font-size: 1rem; font-weight: 600; color: #78716c; }
.empty-hint { font-size: 0.875rem; color: #a8a29e; }
.empty-hint strong { color: #7c3aed; font-weight: 600; }
</style>
