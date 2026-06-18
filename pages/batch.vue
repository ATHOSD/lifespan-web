<template>
  <div class="batch-root">

    <!-- ── Left panel ─────────────────────────────────────── -->
    <div class="left-panel">
      <div class="page-header">
        <h1 class="page-title">Batch Processing</h1>
        <p class="page-desc">Process multiple MRI scans sequentially</p>
      </div>

      <!-- Upload zone -->
      <div
        class="upload-zone"
        :class="{ 'upload-active': isDragging }"
        @click="fileInput?.click()"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="onDrop"
      >
        <input ref="fileInput" type="file" style="display:none" multiple accept=".nii,.gz,application/gzip,application/octet-stream" @change="onFileChange" />
        <div class="upload-icon-wrap">
          <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
            <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M16 8l-4-4-4 4M12 4v12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div>
          <div class="upload-cta">Click or drag files here</div>
          <div class="upload-hint">Multiple .nii / .nii.gz files</div>
        </div>
      </div>

      <!-- File list -->
      <div v-if="files.length > 0" class="files-card">
        <!-- Progress -->
        <div class="progress-section">
          <div class="progress-meta">
            <span class="progress-label">{{ doneCount + failedCount }} / {{ files.length }} processed</span>
            <span class="progress-counts">
              <span v-if="doneCount" class="count-done">{{ doneCount }} done</span>
              <span v-if="failedCount" class="count-fail">{{ failedCount }} failed</span>
            </span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: ((doneCount + failedCount) / files.length * 100) + '%' }" />
          </div>
        </div>

        <!-- Actions -->
        <div class="action-row">
          <button class="btn-run" :disabled="running || queuedCount === 0" @click="runAll">
            <span v-if="running" class="spinner" />
            <svg v-else viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
              <path d="M6.3 2.84A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.27l9.344-5.891a1.5 1.5 0 000-2.538L6.3 2.84z"/>
            </svg>
            {{ running ? 'Processing…' : `Run All (${queuedCount})` }}
          </button>
          <button class="btn-clear" :disabled="running" @click="clearAll">Clear</button>
        </div>

        <!-- Rows -->
        <div class="file-list">
          <div
            v-for="f in files" :key="f.id"
            class="file-row"
            :class="{
              'row-done': f.status === 'done',
              'row-selected': selected?.id === f.id,
            }"
            @click="f.status === 'done' && select(f)"
          >
            <!-- Status badge -->
            <div class="badge-wrap">
              <span v-if="f.status === 'queued'"  class="badge badge-q">Queued</span>
              <span v-if="f.status === 'running'" class="badge badge-r"><span class="badge-spin"/>Running</span>
              <span v-if="f.status === 'done'"    class="badge badge-d">Done</span>
              <span v-if="f.status === 'failed'"  class="badge badge-f">Failed</span>
            </div>

            <!-- File name -->
            <div class="file-name-wrap">
              <div class="file-name">{{ f.file.name }}</div>
              <div v-if="f.error" class="file-err">{{ f.error }}</div>
            </div>

            <!-- Modality -->
            <select v-model="f.modality" class="mod-sel" :disabled="f.status !== 'queued'" @click.stop>
              <option>T1w</option><option>T2w</option><option>FA</option><option>MD</option>
            </select>

            <!-- Download -->
            <a v-if="f.segUrl" :href="f.segUrl" download="segmentation.nii.gz" class="row-dl" @click.stop title="Download mask">
              <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
                <path d="M2 12h12v1.5H2V12zm5.25-3.44V2h1.5v6.56l2.47-2.47 1.06 1.06L8 11.39l-4.28-4.24 1.06-1.06 2.47 2.47z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Right panel ────────────────────────────────────── -->
    <div class="right-panel">
      <template v-if="selected">
        <div class="card">
          <div class="card-header">
            <div>
              <h2 class="card-title">{{ selected.file.name }}</h2>
              <p class="card-sub">Hover to inspect labels · scroll to zoom</p>
            </div>
            <a :href="selected.segUrl!" download="segmentation.nii.gz" class="btn-dl">
              <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
                <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd"/>
              </svg>
              Download Mask
            </a>
          </div>
          <MriViewer :key="selected.id" :mri-url="selected.mriUrl" :seg-url="selected.segUrl" @volumes="onVolumes" />
        </div>

        <div v-if="selected.volumes.length" class="card">
          <div class="card-header">
            <div>
              <h2 class="card-title">Tissue Volumes</h2>
              <p class="card-sub">{{ selected.volumes.length }} regions · {{ (selectedTotal / 1000).toFixed(0) }} cm³ total</p>
            </div>
          </div>
          <table class="vol-table">
            <thead>
              <tr>
                <th>Region</th>
                <th style="text-align:right">Volume (mm³)</th>
                <th style="text-align:right">% Total</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="v in selected.volumes" :key="v.label">
                <td>
                  <span class="label-dot" :style="{ background: COLORS[v.label-1] ?? '#666' }" />
                  Label {{ v.label }}
                </td>
                <td style="text-align:right;font-variant-numeric:tabular-nums">{{ v.volume.toLocaleString() }}</td>
                <td>
                  <div class="pct-cell">
                    <div class="pct-bar"><div class="pct-fill" :style="{ width: ((v.volume/selectedTotal)*100).toFixed(1)+'%', background: COLORS[v.label-1] ?? '#666' }" /></div>
                    <span class="pct-num">{{ ((v.volume/selectedTotal)*100).toFixed(1) }}%</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>

      <div v-else class="empty-right">
        <div class="empty-icon">
          <svg viewBox="0 0 48 48" fill="none" width="48" height="48">
            <rect x="6" y="6" width="36" height="36" rx="8" stroke="#d6d3cd" stroke-width="2"/>
            <path d="M16 24h16M24 16v16" stroke="#d6d3cd" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
        <p>Click a completed file to preview its segmentation</p>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const COLORS = [
  '#CD3E4E','#781286','#C43AFA','#E69422','#00760E',
  '#7ABADC','#EC0DB0','#0C30FF','#DCD814','#2ACCA4',
  '#FF8000','#67FFFF','#779FB0','#FFC8C8',
]

interface BatchFile {
  id: string
  file: File
  modality: string
  status: 'queued' | 'running' | 'done' | 'failed'
  mriUrl: string
  segUrl: string | null
  volumes: { label: number; volume: number }[]
  error: string | null
}

const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const files = ref<BatchFile[]>([])
const running = ref(false)
const selected = ref<BatchFile | null>(null)

const doneCount   = computed(() => files.value.filter(f => f.status === 'done').length)
const failedCount = computed(() => files.value.filter(f => f.status === 'failed').length)
const queuedCount = computed(() => files.value.filter(f => f.status === 'queued').length)
const selectedTotal = computed(() => selected.value?.volumes.reduce((s, v) => s + v.volume, 0) ?? 0)

function addFiles(newFiles: FileList | File[]) {
  const existing = new Set(files.value.map(f => f.file.name))
  for (const file of Array.from(newFiles)) {
    if (existing.has(file.name)) continue
    files.value.push({
      id: crypto.randomUUID(),
      file,
      modality: 'T1w',
      status: 'queued',
      mriUrl: URL.createObjectURL(file),
      segUrl: null,
      volumes: [],
      error: null,
    })
  }
}

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files) addFiles(input.files)
  input.value = ''
}

function onDrop(e: DragEvent) {
  isDragging.value = false
  if (e.dataTransfer?.files) addFiles(e.dataTransfer.files)
}

function select(f: BatchFile) {
  selected.value = f
}

function onVolumes(data: { label: number; volume: number }[]) {
  if (selected.value) selected.value.volumes = data
}

function clearAll() {
  files.value = []
  selected.value = null
}

async function runAll() {
  running.value = true
  for (const f of files.value) {
    if (f.status !== 'queued') continue
    f.status = 'running'
    try {
      const form = new FormData()
      form.append('scan', f.file)
      form.append('modality', f.modality)
      const res = await $fetch<{ segUrl: string }>('/api/segment', { method: 'POST', body: form })
      f.segUrl = `/api/download?url=${encodeURIComponent(res.segUrl)}`
      f.status = 'done'
      if (!selected.value) selected.value = f
    } catch (e: any) {
      f.status = 'failed'
      f.error = e?.data?.message || e.message || 'Failed'
    }
  }
  running.value = false
}
</script>

<style scoped>
.batch-root {
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 20px;
  align-items: start;
  min-height: calc(100vh - 68px - 64px);
}

/* ── Page header ── */
.page-header { margin-bottom: 20px; }
.page-title { font-size: 1.75rem; font-weight: 700; letter-spacing: -0.03em; color: #1c1917; }
.page-desc { font-size: 1rem; color: #a8a29e; margin-top: 5px; }

/* ── Upload zone ── */
.upload-zone {
  display: flex; align-items: center; gap: 14px;
  padding: 16px 18px;
  background: #ffffff;
  border: 1.5px dashed #d6d3cd;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 14px;
  box-shadow: 0 1px 4px rgba(28,25,23,0.04);
}
.upload-zone:hover, .upload-active { border-color: #7c3aed; background: #f3f0ff; }
.upload-icon-wrap {
  width: 36px; height: 36px; border-radius: 9px;
  background: #f0ede8; display: flex; align-items: center; justify-content: center;
  color: #a8a29e; flex-shrink: 0;
}
.upload-active .upload-icon-wrap, .upload-zone:hover .upload-icon-wrap { background: #ede9fe; color: #7c3aed; }
.upload-cta { font-size: 0.9rem; font-weight: 500; color: #57534e; }
.upload-hint { font-size: 0.75rem; color: #c4bfb8; margin-top: 2px; }

/* ── Files card ── */
.files-card {
  background: #ffffff;
  border: 1px solid #e8e4dc;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(28,25,23,0.04);
}

.progress-section { padding: 16px 16px 12px; border-bottom: 1px solid #f0ede8; }
.progress-meta { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.progress-label { font-size: 0.8rem; font-weight: 600; color: #78716c; }
.progress-counts { display: flex; gap: 8px; }
.count-done { font-size: 0.75rem; color: #16a34a; font-weight: 600; }
.count-fail { font-size: 0.75rem; color: #dc2626; font-weight: 600; }
.progress-bar { height: 4px; background: #f0ede8; border-radius: 999px; overflow: hidden; }
.progress-fill { height: 100%; background: linear-gradient(90deg, #7c3aed, #9333ea); border-radius: 999px; transition: width 0.4s ease; }

.action-row { display: flex; gap: 8px; padding: 12px 16px; border-bottom: 1px solid #f0ede8; }
.btn-run {
  display: inline-flex; align-items: center; gap: 7px;
  background: linear-gradient(135deg, #7c3aed, #9333ea);
  color: white; border: none; border-radius: 8px;
  padding: 9px 18px; font-size: 0.875rem; font-weight: 600;
  cursor: pointer; transition: all 0.2s; flex: 1;
}
.btn-run:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(124,58,237,0.3); }
.btn-run:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-clear {
  background: #faf9f6; border: 1px solid #e8e4dc; color: #78716c;
  border-radius: 8px; padding: 9px 14px; font-size: 0.875rem;
  cursor: pointer; transition: all 0.15s;
}
.btn-clear:hover:not(:disabled) { background: #f0ede8; }
.btn-clear:disabled { opacity: 0.4; cursor: not-allowed; }

.spinner {
  width: 13px; height: 13px;
  border: 2px solid rgba(255,255,255,0.3); border-top-color: white;
  border-radius: 50%; animation: spin 0.65s linear infinite; flex-shrink: 0;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── File rows ── */
.file-list { display: flex; flex-direction: column; }
.file-row {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 16px;
  border-bottom: 1px solid #f0ede8;
  transition: background 0.12s;
}
.file-row:last-child { border-bottom: none; }
.row-done { cursor: pointer; }
.row-done:hover { background: #faf9f6; }
.row-selected { background: #f3f0ff !important; }

.badge-wrap { flex-shrink: 0; }
.badge {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 0.68rem; font-weight: 600; border-radius: 999px; padding: 2px 8px;
}
.badge-q { background: #f0ede8; color: #a8a29e; }
.badge-r { background: #eff6ff; color: #2563eb; }
.badge-d { background: #f0fdf4; color: #16a34a; }
.badge-f { background: #fef2f2; color: #dc2626; }
.badge-spin {
  width: 8px; height: 8px;
  border: 1.5px solid rgba(37,99,235,0.3); border-top-color: #2563eb;
  border-radius: 50%; animation: spin 0.65s linear infinite;
}

.file-name-wrap { flex: 1; min-width: 0; }
.file-name { font-size: 0.8rem; color: #57534e; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.file-err { font-size: 0.72rem; color: #dc2626; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.mod-sel {
  font-size: 0.78rem; color: #57534e;
  background: #faf9f6; border: 1px solid #e8e4dc;
  border-radius: 6px; padding: 4px 6px;
  width: 56px; flex-shrink: 0;
}
.mod-sel:disabled { opacity: 0.5; }

.row-dl {
  display: flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; border-radius: 6px;
  background: #f0fdf4; border: 1px solid #bbf7d0; color: #16a34a;
  flex-shrink: 0; text-decoration: none; transition: background 0.15s;
}
.row-dl:hover { background: #dcfce7; }

/* ── Right panel ── */
.right-panel { display: flex; flex-direction: column; gap: 20px; min-width: 0; }

.card {
  background: #ffffff; border: 1px solid #e8e4dc;
  border-radius: 16px; padding: 24px;
  box-shadow: 0 1px 4px rgba(28,25,23,0.05);
}
.card-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 18px; gap: 12px; }
.card-title { font-size: 1rem; font-weight: 600; color: #1c1917; }
.card-sub { font-size: 0.8rem; color: #a8a29e; margin-top: 3px; }

.btn-dl {
  display: inline-flex; align-items: center; gap: 6px;
  background: #f0fdf4; border: 1px solid #bbf7d0; color: #16a34a;
  border-radius: 8px; padding: 7px 14px; font-size: 0.8rem; font-weight: 600;
  text-decoration: none; white-space: nowrap; transition: all 0.15s; flex-shrink: 0;
}
.btn-dl:hover { background: #dcfce7; }

.vol-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
.vol-table th {
  color: #a8a29e; font-weight: 600; font-size: 0.7rem;
  text-transform: uppercase; letter-spacing: 0.08em;
  padding: 5px 10px 9px; border-bottom: 1px solid #e8e4dc;
}
.vol-table td { padding: 9px 10px; color: #57534e; border-bottom: 1px solid #f0ede8; vertical-align: middle; }
.vol-table tbody tr:last-child td { border-bottom: none; }
.vol-table tbody tr:hover td { background: #faf9f6; }
.label-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 8px; vertical-align: middle; }
.pct-cell { display: flex; align-items: center; justify-content: flex-end; gap: 10px; }
.pct-bar { width: 80px; height: 4px; background: #f0ede8; border-radius: 999px; overflow: hidden; }
.pct-fill { height: 100%; border-radius: 999px; opacity: 0.8; }
.pct-num { width: 40px; text-align: right; font-variant-numeric: tabular-nums; }

/* ── Empty state ── */
.empty-right {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 14px; padding: 80px 40px;
  background: #ffffff; border: 1px solid #e8e4dc; border-radius: 16px;
  box-shadow: 0 1px 4px rgba(28,25,23,0.05);
  text-align: center;
  min-height: 300px;
}
.empty-icon { opacity: 0.4; }
.empty-right p { font-size: 0.9rem; color: #a8a29e; }
</style>
