<template>
  <div class="app">
    <!-- Disclaimer modal -->
    <div v-if="showDisclaimer" class="modal-backdrop">
      <div class="modal">
        <h2>Data Privacy Notice</h2>
        <p>
          This tool sends your MRI scan to <strong>Replicate</strong> (a third-party cloud service)
          for processing. Please be aware:
        </p>
        <ul>
          <li>Do <strong>not</strong> upload identifiable patient data.</li>
          <li>Use anonymized or de-identified scans only.</li>
          <li>This tool is for <strong>research purposes only</strong> and is not intended for clinical use.</li>
        </ul>
        <button class="btn-primary" @click="acceptDisclaimer">I Understand, Continue</button>
      </div>
    </div>

    <header>
      <h1>Lifespan Brain Segmentation</h1>
    </header>

    <main>
      <!-- Upload Panel -->
      <section class="upload-panel">
        <div class="form-group">
          <label>MRI Scan (.nii.gz)</label>
          <input type="file" accept=".nii,.gz,application/gzip,application/octet-stream" @change="onFileChange" />
        </div>

        <div class="form-group">
          <label>Modality</label>
          <select v-model="modality">
            <option>T1w</option>
            <option>T2w</option>
            <option>FA</option>
            <option>MD</option>
          </select>
        </div>

        <div class="form-group">
          <label>Age <span class="optional">(optional)</span></label>
          <div class="age-row">
            <select v-model="ageType" class="age-type">
              <option value="GA">GA</option>
              <option value="Postnatal">Postnatal</option>
            </select>
            <input type="number" v-model="ageValue" min="0" placeholder="--" class="age-num" />
            <select v-model="ageUnit" class="age-unit">
              <option value="weeks">weeks</option>
              <option value="months">months</option>
              <option value="years">years</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label>Sex <span class="optional">(optional)</span></label>
          <select v-model="sex">
            <option value="">--</option>
            <option value="M">Male</option>
            <option value="F">Female</option>
          </select>
        </div>

        <button :disabled="!file || loading" @click="runSegmentation">
          {{ loading ? 'Running...' : 'Run Segmentation' }}
        </button>

        <p v-if="error" class="error">{{ error }}</p>
      </section>

      <!-- Viewer -->
      <section v-if="segUrl" class="viewer-panel">
        <MriViewer :mri-url="mriUrl" :seg-url="segUrl" @volumes="onVolumes" />

        <!-- Volume Table -->
        <div v-if="volumes.length" class="volumes">
          <div class="volumes-header">
            <h2>Tissue Volumes</h2>
            <a :href="segUrl" download="segmentation.nii.gz" class="btn-download">
              Download Mask (.nii.gz)
            </a>
          </div>
          <table>
            <thead>
              <tr><th>Label</th><th>Volume (mm³)</th><th>% ICV</th></tr>
            </thead>
            <tbody>
              <tr v-for="v in volumes" :key="v.label">
                <td>Label {{ v.label }}</td>
                <td>{{ v.volume.toLocaleString() }}</td>
                <td>{{ ((v.volume / totalVolume) * 100).toFixed(2) }}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
const file = ref<File | null>(null)
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

function onVolumes(data: { label: number; volume: number }[]) {
  volumes.value = data
}

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  file.value = input.files?.[0] || null
  if (file.value) {
    mriUrl.value = URL.createObjectURL(file.value)
    segUrl.value = null
    volumes.value = []
  }
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

<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
html { font-size: 18px; }
body { font-family: system-ui, sans-serif; background: #0f0f0f; color: #e0e0e0; }

.app { max-width: 1100px; margin: 0 auto; padding: 32px; }

header { margin-bottom: 32px; }
header h1 { font-size: 2rem; font-weight: 600; }

/* Disclaimer modal */
.modal-backdrop {
  position: fixed; inset: 0; background: rgba(0,0,0,0.75);
  display: flex; align-items: center; justify-content: center; z-index: 100;
}
.modal {
  background: #1e1e1e; border-radius: 14px; padding: 36px;
  max-width: 520px; width: 90%; display: flex; flex-direction: column; gap: 16px;
}
.modal h2 { font-size: 1.3rem; }
.modal p, .modal li { font-size: 0.95rem; color: #ccc; line-height: 1.6; }
.modal ul { padding-left: 20px; display: flex; flex-direction: column; gap: 6px; }
.modal strong { color: #fff; }

.btn-primary {
  background: #3b82f6; color: white; border: none; border-radius: 8px;
  padding: 12px 28px; font-size: 1rem; cursor: pointer; align-self: flex-end; margin-top: 8px;
}
.btn-primary:hover { background: #2563eb; }

/* Upload panel */
.upload-panel {
  background: #1e1e1e; border-radius: 12px; padding: 32px;
  display: flex; gap: 24px; align-items: flex-end; flex-wrap: wrap; margin-bottom: 32px;
}

.form-group { display: flex; flex-direction: column; gap: 8px; }
.form-group label { font-size: 1rem; color: #aaa; }
.optional { font-size: 0.8rem; color: #666; }

input[type="file"], select, input[type="number"] {
  background: #2a2a2a; border: 1px solid #444; border-radius: 8px;
  color: #e0e0e0; padding: 12px 16px; font-size: 1rem;
}
select { cursor: pointer; }
input[type="number"] { width: 80px; }
input[type="number"]::-webkit-inner-spin-button { opacity: 1; }

.age-row { display: flex; gap: 8px; align-items: center; }
.age-type { width: 110px; }
.age-num { width: 80px; padding: 12px 10px; }
.age-unit { width: 110px; }

button {
  background: #3b82f6; color: white; border: none; border-radius: 8px;
  padding: 12px 32px; font-size: 1.1rem; cursor: pointer; height: fit-content;
}
button:disabled { background: #555; cursor: not-allowed; }
button:hover:not(:disabled) { background: #2563eb; }

.error { color: #f87171; font-size: 1rem; width: 100%; }

.viewer-panel { display: flex; flex-direction: column; gap: 32px; }

/* Volumes table */
.volumes { background: #1e1e1e; border-radius: 12px; padding: 28px; }
.volumes-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.volumes-header h2 { font-size: 1.2rem; }
.btn-download {
  background: #22c55e; color: #000; border-radius: 8px;
  padding: 8px 20px; font-size: 0.9rem; font-weight: 600;
  text-decoration: none; white-space: nowrap;
}
.btn-download:hover { background: #16a34a; color: #fff; }

table { width: 100%; border-collapse: collapse; font-size: 1rem; }
th, td { padding: 12px 16px; text-align: left; border-bottom: 1px solid #333; }
th { color: #aaa; font-weight: 500; }
</style>
