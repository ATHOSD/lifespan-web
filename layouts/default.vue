<template>
  <div class="shell">
    <!-- Disclaimer modal -->
    <Transition name="fade">
      <div v-if="showDisclaimer" class="modal-backdrop">
        <div class="modal-box">
          <div class="modal-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L4 6v6c0 5.5 3.4 10.7 8 12 4.6-1.3 8-6.5 8-12V6l-8-4z" stroke="#7c3aed" stroke-width="1.5" stroke-linejoin="round"/>
              <path d="M9 12l2 2 4-4" stroke="#7c3aed" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h2>Data Privacy Notice</h2>
          <p>This tool sends your MRI scan to <strong>Replicate</strong>, a third-party cloud service, for AI-powered brain segmentation.</p>
          <ul>
            <li>Do <strong>not</strong> upload identifiable patient data</li>
            <li>Use only anonymized or de-identified scans</li>
            <li>For <strong>research purposes only</strong> — not intended for clinical use</li>
          </ul>
          <button class="modal-btn" @click="acceptDisclaimer">
            I Understand, Continue
          </button>
        </div>
      </div>
    </Transition>

    <!-- Navbar -->
    <header class="navbar">
      <div class="brand">
        <div class="brand-icon">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="20" height="20">
            <path d="M9.5 3C7.6 3 6 4.6 6 6.5c0 .2 0 .4.1.6C4.9 7.6 4 8.9 4 10.5c0 1.2.5 2.3 1.3 3C5.1 14.3 5 15.1 5 16c0 2.8 2.2 5 5 5h4c2.8 0 5-2.2 5-5 0-.9-.1-1.7-.3-2.5.8-.7 1.3-1.8 1.3-3 0-1.6-.9-2.9-2.1-3.4.1-.2.1-.4.1-.6C18 4.6 16.4 3 14.5 3c-.9 0-1.7.4-2.3 1C11.7 3.4 10.9 3 10 3" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M12 8v4M10 10h4" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </div>
        <span class="brand-name">Neuro<span class="brand-accent">LS</span></span>
      </div>
      <div class="navbar-right">
        <span class="version-pill">Research Preview</span>
      </div>
    </header>

    <div class="body">
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-section">WORKSPACE</div>
        <nav class="sidebar-nav">
          <NuxtLink to="/" class="nav-item" :class="{ active: route.path === '/' }">
            <svg class="nav-icon" viewBox="0 0 20 20" fill="none">
              <rect x="2" y="2" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.5"/>
              <rect x="11" y="2" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.5"/>
              <rect x="2" y="11" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.5"/>
              <path d="M11 14.5h7M14.5 11v7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            <span>Single Sample</span>
          </NuxtLink>
          <NuxtLink to="/batch" class="nav-item" :class="{ active: route.path === '/batch' }">
            <svg class="nav-icon" viewBox="0 0 20 20" fill="none">
              <path d="M3 5h14M3 10h14M3 15h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            <span>Batch Processing</span>
            <span class="soon-tag">Soon</span>
          </NuxtLink>
        </nav>
        <div class="sidebar-footer">
          <div class="sidebar-divider" />
          <span class="sidebar-ver">NeuroLS v1.0</span>
        </div>
      </aside>

      <!-- Main content -->
      <main class="main">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const showDisclaimer = ref(false)

onMounted(() => {
  if (!sessionStorage.getItem('disclaimer-accepted')) {
    showDisclaimer.value = true
  }
})

function acceptDisclaimer() {
  sessionStorage.setItem('disclaimer-accepted', '1')
  showDisclaimer.value = false
}
</script>

<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { font-size: 16px; }
body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #faf9f6;
  color: #1c1917;
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
}
a { text-decoration: none; }
</style>

<style scoped>
.shell { display: flex; flex-direction: column; min-height: 100vh; }

/* ── Navbar ─────────────────────────────── */
.navbar {
  height: 68px;
  background: #ffffff;
  border-bottom: 1px solid #e8e4dc;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 28px;
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 50;
}

.brand { display: flex; align-items: center; gap: 11px; }
.brand-icon {
  width: 36px; height: 36px;
  background: linear-gradient(135deg, #7c3aed 0%, #9333ea 100%);
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 2px 8px rgba(124, 58, 237, 0.3);
}
.brand-name {
  font-size: 2.0rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: #1c1917;
}
.brand-accent {
  background: linear-gradient(90deg, #7c3aed, #9333ea);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.navbar-right { display: flex; align-items: center; }
.version-pill {
  font-size: 0.8rem;
  font-weight: 500;
  color: #a8a29e;
  background: #f5f3ef;
  border: 1px solid #e8e4dc;
  border-radius: 999px;
  padding: 5px 14px;
}

/* ── Body ───────────────────────────────── */
.body { display: flex; padding-top: 68px; flex: 1; }

/* ── Sidebar ────────────────────────────── */
.sidebar {
  width: 216px;
  min-width: 216px;
  background: #f5f3ef;
  border-right: 1px solid #e8e4dc;
  position: fixed;
  top: 68px; left: 0; bottom: 0;
  display: flex;
  flex-direction: column;
  padding: 20px 10px 16px;
}
.sidebar-section {
  font-size: 0.65rem;
  font-weight: 700;
  color: #a8a29e;
  letter-spacing: 0.12em;
  padding: 0 10px;
  margin-bottom: 6px;
}
.sidebar-nav { display: flex; flex-direction: column; gap: 2px; }

.nav-item {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 10px 10px;
  border-radius: 9px;
  font-size: 0.925rem;
  font-weight: 500;
  color: #78716c;
  cursor: pointer;
  transition: all 0.15s ease;
  position: relative;
  user-select: none;
}
.nav-item:hover { background: #ede9e3; color: #1c1917; }
.nav-item.active { background: #ede9fe; color: #7c3aed; }
.nav-item.active::before {
  content: '';
  position: absolute;
  left: 0; top: 25%; bottom: 25%;
  width: 3px;
  background: linear-gradient(180deg, #7c3aed, #9333ea);
  border-radius: 999px;
}
.nav-icon { width: 17px; height: 17px; flex-shrink: 0; }
.soon-tag {
  margin-left: auto;
  font-size: 0.62rem;
  font-weight: 600;
  color: #a8a29e;
  background: #ede9e3;
  border: 1px solid #d6d3cd;
  border-radius: 999px;
  padding: 2px 7px;
}

.sidebar-footer { margin-top: auto; padding: 0 6px; }
.sidebar-divider { height: 1px; background: #e8e4dc; margin-bottom: 12px; }
.sidebar-ver { font-size: 0.7rem; color: #c4bfb8; }

/* ── Main ───────────────────────────────── */
.main { margin-left: 216px; flex: 1; padding: 32px 36px; min-width: 0; }

/* ── Disclaimer modal ───────────────────── */
.modal-backdrop {
  position: fixed; inset: 0;
  background: rgba(28, 25, 23, 0.45);
  backdrop-filter: blur(6px);
  display: flex; align-items: center; justify-content: center;
  z-index: 100;
}
.modal-box {
  background: #ffffff;
  border: 1px solid #e8e4dc;
  border-radius: 20px;
  padding: 40px;
  max-width: 460px; width: 90%;
  display: flex; flex-direction: column; gap: 14px;
  box-shadow: 0 20px 60px rgba(28, 25, 23, 0.12);
}
.modal-icon {
  width: 44px; height: 44px;
  background: #f3f0ff;
  border: 1px solid #ddd6fe;
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
}
.modal-icon svg { width: 22px; height: 22px; }
.modal-box h2 { font-size: 1.2rem; font-weight: 700; color: #1c1917; }
.modal-box p { font-size: 0.9rem; color: #78716c; line-height: 1.65; }
.modal-box strong { color: #1c1917; font-weight: 600; }
.modal-box ul { list-style: none; display: flex; flex-direction: column; gap: 8px; }
.modal-box li {
  font-size: 0.875rem; color: #57534e; line-height: 1.5;
  padding: 8px 12px 8px 32px; position: relative;
  background: #faf9f6;
  border-radius: 8px;
  border: 1px solid #e8e4dc;
}
.modal-box li::before {
  content: '✓';
  position: absolute; left: 10px;
  color: #7c3aed;
  font-weight: 700;
  font-size: 0.75rem;
}
.modal-btn {
  background: linear-gradient(135deg, #7c3aed, #9333ea);
  color: white;
  border: none;
  border-radius: 10px;
  padding: 13px;
  font-size: 0.925rem;
  font-weight: 600;
  cursor: pointer;
  width: 100%;
  margin-top: 4px;
  transition: all 0.2s;
}
.modal-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 24px rgba(124, 58, 237, 0.35);
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
