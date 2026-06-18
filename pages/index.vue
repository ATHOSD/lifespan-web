<template>
  <div>
    <!-- Page header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Single Sample Analysis</h1>
        <p class="page-desc">Upload an MRI scan to generate AI-powered brain tissue segmentation</p>
      </div>
    </div>

    <!-- Config card -->
    <div class="card">
      <div class="config-grid">
        <!-- File upload -->
        <div class="field-group span-full">
          <label class="field-label">MRI Scan</label>
          <div
            class="upload-zone"
            :class="{ 'upload-active': isDragging, 'upload-filled': !!file }"
            @click="fileInput?.click()"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="onDrop"
          >
            <input ref="fileInput" type="file" style="display:none" accept=".nii,.gz,application/gzip,application/octet-stream" @change="onFileChange" />
            <div class="upload-icon-wrap">
              <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
                <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M16 8l-4-4-4 4M12 4v12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="upload-text">
              <span v-if="file" class="upload-filename">{{ file.name }}</span>
              <template v-else>
                <span class="upload-cta">Click to browse <span class="upload-muted">or drag & drop</span></span>
              </template>
            </div>
            <span class="upload-hint">NIfTI format · .nii or .nii.gz</span>
          </div>
        </div>

        <!-- Modality -->
        <div class="field-group">
          <label class="field-label">Modality</label>
          <select v-model="modality" class="field-select">
            <option>T1w</option>
            <option>T2w</option>
            <option>FA</option>
            <option>MD</option>
          </select>
        </div>

        <!-- Age -->
        <div class="field-group span-2">
          <label class="field-label">Age <span class="optional-tag">for growth curve · optional</span></label>
          <div class="age-row">
            <select v-model="ageType" class="field-select" style="width:90px;flex-shrink:0">
              <option value="GA">GA</option>
              <option value="Postnatal">Postnatal</option>
            </select>
            <input
              type="number" v-model="ageValue" min="0" max="9999" step="any"
              placeholder="—" class="field-input"
              @keydown="blockNonNumeric" @paste.prevent
            />
            <select v-model="ageUnit" class="field-select" style="width:74px;flex-shrink:0">
              <option value="weeks">wk</option>
              <option value="months">mo</option>
              <option value="years">yr</option>
            </select>
          </div>
        </div>

        <!-- Sex -->
        <div class="field-group">
          <label class="field-label">Sex <span class="optional-tag">for growth curve · optional</span></label>
          <select v-model="sex" class="field-select">
            <option value="">—</option>
            <option value="M">Male</option>
            <option value="F">Female</option>
          </select>
        </div>

        <!-- Run -->
        <div class="field-group run-col">
          <button class="btn-run" :disabled="!file || loading" @click="runSegmentation">
            <span v-if="loading" class="spinner" />
            <svg v-else viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
              <path d="M6.3 2.84A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.27l9.344-5.891a1.5 1.5 0 000-2.538L6.3 2.84z"/>
            </svg>
            {{ loading ? 'Processing…' : 'Run Segmentation' }}
          </button>
        </div>
      </div>

      <!-- Error -->
      <div v-if="error" class="error-bar">
        <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16" style="flex-shrink:0">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
        </svg>
        {{ error }}
      </div>
    </div>

    <!-- Results -->
    <Transition name="rise">
      <div v-if="segUrl" class="results-grid">
        <!-- Viewer -->
        <div class="card viewer-card">
          <div class="card-header">
            <div>
              <h2 class="card-title">Segmentation Preview</h2>
              <p class="card-sub">Hover to inspect tissue labels · scroll to zoom</p>
            </div>
            <a :href="segUrl" download="segmentation.nii.gz" class="btn-dl">
              <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
                <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd"/>
              </svg>
              Download Mask
            </a>
          </div>
          <MriViewer :mri-url="mriUrl" :seg-url="segUrl" @volumes="onVolumes" />
        </div>

        <!-- Volume table -->
        <div v-if="volumes.length" class="card">
          <div class="card-header">
            <div>
              <h2 class="card-title">Tissue Volumes</h2>
              <p class="card-sub">{{ volumes.length }} regions · {{ (totalVolume / 1000).toFixed(0) }} cm³ total labeled</p>
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
              <tr v-for="v in volumes" :key="v.label">
                <td>
                  <span class="label-dot" :style="{ background: COLORS[v.label - 1] ?? '#666' }" />
                  Label {{ v.label }}
                </td>
                <td style="text-align:right;font-variant-numeric:tabular-nums">{{ v.volume.toLocaleString() }}</td>
                <td>
                  <div class="pct-cell">
                    <div class="pct-bar">
                      <div class="pct-fill" :style="{ width: ((v.volume / totalVolume) * 100).toFixed(1) + '%', background: COLORS[v.label - 1] ?? '#666' }" />
                    </div>
                    <span class="pct-num">{{ ((v.volume / totalVolume) * 100).toFixed(1) }}%</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
const COLORS = [
  '#CD3E4E','#781286','#C43AFA','#E69422','#00760E',
  '#7ABADC','#EC0DB0','#0C30FF','#DCD814','#2ACCA4',
  '#FF8000','#67FFFF','#779FB0','#FFC8C8',
]

const fileInput = ref<HTMLInputElement | null>(null)
const file = ref<File | null>(null)
const isDragging = ref(false)
const modality = ref('T1w')
const ageType = ref('GA')
const ageValue = ref<number | null>(null)
const ageUnit = ref('weeks')
const sex = ref('')
const loading = ref(false)
const error = ref('')
const mriUrl = ref<string | null>(null)
const segUrl = ref<string | null>(null)
const volumes = ref<{ label: number; volume: number }[]>([])

const totalVolume = computed(() => volumes.value.reduce((s, v) => s + v.volume, 0))

function onVolumes(data: { label: number; volume: number }[]) {
  volumes.value = data
}

function blockNonNumeric(e: KeyboardEvent) {
  if (['Backspace','Delete','Tab','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) return
  if (e.key === '.' && !(e.target as HTMLInputElement).value.includes('.')) return
  if (!/^\d$/.test(e.key)) e.preventDefault()
}

function setFile(f: File) {
  file.value = f
  mriUrl.value = URL.createObjectURL(f)
  segUrl.value = null
  volumes.value = []
  error.value = ''
}

function onFileChange(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (f) setFile(f)
}

function onDrop(e: DragEvent) {
  isDragging.value = false
  const f = e.dataTransfer?.files?.[0]
  if (f) setFile(f)
}

async function runSegmentation() {
  if (!file.value) return
  loading.value = true
  error.value = ''
  segUrl.value = null
  volumes.value = []

  try {
    const form = new FormData()
    form.append('scan', file.value)
    form.append('modality', modality.value)

    const res = await $fetch<{ segUrl: string }>('/api/segment', {
      method: 'POST',
      body: form,
    })

    segUrl.value = `/api/download?url=${encodeURIComponent(res.segUrl)}`
  } catch (e: any) {
    error.value = e?.data?.message || e.message || 'Unknown error'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.page-header { margin-bottom: 28px; }
.page-title { font-size: 1.75rem; font-weight: 700; letter-spacing: -0.03em; color: #1c1917; }
.page-desc { font-size: 1rem; color: #a8a29e; margin-top: 6px; }

.card {
  background: #ffffff;
  border: 1px solid #e8e4dc;
  border-radius: 16px;
  padding: 28px;
  box-shadow: 0 1px 4px rgba(28, 25, 23, 0.05);
  margin-bottom: 20px;
}
.card-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 18px; gap: 12px; }
.card-title { font-size: 1.1rem; font-weight: 600; color: #1c1917; }
.card-sub { font-size: 0.875rem; color: #a8a29e; margin-top: 3px; }

.config-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px;
  align-items: end;
}
.span-full { grid-column: 1 / -1; }
.span-2 { grid-column: span 2; }

.field-group { display: flex; flex-direction: column; gap: 8px; }
.field-label { font-size: 0.78rem; font-weight: 600; color: #a8a29e; text-transform: uppercase; letter-spacing: 0.08em; }
.optional-tag { font-size: 0.7rem; color: #c4bfb8; text-transform: none; letter-spacing: 0; font-weight: 400; margin-left: 4px; }

.field-select, .field-input {
  background: #faf9f6;
  border: 1px solid #d6d3cd;
  border-radius: 9px;
  color: #1c1917;
  padding: 11px 13px;
  font-size: 0.95rem;
  width: 100%;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.field-select:focus, .field-input:focus {
  outline: none;
  border-color: #7c3aed;
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.08);
}
.field-select { cursor: pointer; }
input[type="number"]::-webkit-inner-spin-button { opacity: 1; }

.age-row { display: flex; gap: 6px; align-items: center; }

.upload-zone {
  display: flex; align-items: center; gap: 14px;
  padding: 16px 20px;
  border: 1.5px dashed #d6d3cd;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #faf9f6;
}
.upload-zone:hover, .upload-active {
  border-color: #7c3aed;
  background: #f3f0ff;
}
.upload-filled {
  border-style: solid;
  border-color: #a78bfa;
  background: #f3f0ff;
}
.upload-icon-wrap {
  width: 38px; height: 38px;
  background: #f0ede8;
  border-radius: 9px;
  display: flex; align-items: center; justify-content: center;
  color: #a8a29e; flex-shrink: 0;
}
.upload-filled .upload-icon-wrap { background: #ede9fe; color: #7c3aed; }
.upload-text { flex: 1; }
.upload-cta { font-size: 0.95rem; color: #78716c; }
.upload-muted { color: #a8a29e; }
.upload-filename { font-size: 0.95rem; color: #7c3aed; font-weight: 500; word-break: break-all; }
.upload-hint { font-size: 0.78rem; color: #c4bfb8; white-space: nowrap; }

.run-col { justify-content: flex-end; }
.btn-run {
  display: inline-flex; align-items: center; gap: 8px;
  background: linear-gradient(135deg, #7c3aed 0%, #9333ea 100%);
  color: #fff; border: none; border-radius: 10px;
  padding: 12px 28px; font-size: 1rem; font-weight: 600;
  cursor: pointer; transition: all 0.2s ease; white-space: nowrap;
}
.btn-run:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 10px 28px rgba(124, 58, 237, 0.3); }
.btn-run:active:not(:disabled) { transform: translateY(0); }
.btn-run:disabled { opacity: 0.4; cursor: not-allowed; }

.spinner {
  width: 15px; height: 15px;
  border: 2px solid rgba(255,255,255,0.35);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.65s linear infinite; flex-shrink: 0;
}
@keyframes spin { to { transform: rotate(360deg); } }

.error-bar {
  display: flex; align-items: center; gap: 8px;
  margin-top: 18px; padding: 12px 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 9px; color: #dc2626; font-size: 0.95rem;
}

.results-grid { display: flex; flex-direction: column; gap: 20px; }

.btn-dl {
  display: inline-flex; align-items: center; gap: 6px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #16a34a; border-radius: 8px; padding: 7px 16px;
  font-size: 0.8rem; font-weight: 600;
  text-decoration: none; white-space: nowrap; transition: all 0.15s;
}
.btn-dl:hover { background: #dcfce7; }

.vol-table { width: 100%; border-collapse: collapse; font-size: 0.95rem; }
.vol-table th {
  color: #a8a29e; font-weight: 600; font-size: 0.75rem;
  text-transform: uppercase; letter-spacing: 0.08em;
  padding: 6px 10px 10px; border-bottom: 1px solid #e8e4dc;
}
.vol-table td {
  padding: 10px 10px; color: #57534e;
  border-bottom: 1px solid #f0ede8; vertical-align: middle;
}
.vol-table tbody tr:last-child td { border-bottom: none; }
.vol-table tbody tr:hover td { background: #faf9f6; color: #1c1917; }

.label-dot {
  display: inline-block; width: 8px; height: 8px;
  border-radius: 50%; margin-right: 9px; vertical-align: middle;
}
.pct-cell { display: flex; align-items: center; justify-content: flex-end; gap: 10px; }
.pct-bar { width: 80px; height: 4px; background: #e8e4dc; border-radius: 999px; overflow: hidden; }
.pct-fill { height: 100%; border-radius: 999px; opacity: 0.8; }
.pct-num { width: 40px; text-align: right; font-variant-numeric: tabular-nums; }

.rise-enter-active { transition: all 0.45s cubic-bezier(0.16, 1, 0.3, 1); }
.rise-enter-from { opacity: 0; transform: translateY(24px); }
</style>
