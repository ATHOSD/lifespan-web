<template>
  <div class="app">
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
          <h2>Tissue Volumes</h2>
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
const loading = ref(false)
const error = ref('')
const mriUrl = ref<string | null>(null)
const segUrl = ref<string | null>(null)
const volumes = ref<{ label: number; volume: number }[]>([])
const totalVolume = computed(() => volumes.value.reduce((s, v) => s + v.volume, 0))

function onVolumes(data: { label: number; volume: number }[]) {
  volumes.value = data
}

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  file.value = input.files?.[0] || null
  if (file.value) mriUrl.value = URL.createObjectURL(file.value)
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

.app { max-width: 1400px; margin: 0 auto; padding: 32px; }

header { margin-bottom: 32px; }
header h1 { font-size: 2rem; font-weight: 600; }

.upload-panel {
  background: #1e1e1e;
  border-radius: 12px;
  padding: 32px;
  display: flex;
  gap: 24px;
  align-items: flex-end;
  flex-wrap: wrap;
  margin-bottom: 32px;
}

.form-group { display: flex; flex-direction: column; gap: 8px; }
.form-group label { font-size: 1rem; color: #aaa; }
input[type="file"], select {
  background: #2a2a2a; border: 1px solid #444; border-radius: 8px;
  color: #e0e0e0; padding: 12px 16px; font-size: 1rem;
}
select { cursor: pointer; }

button {
  background: #3b82f6; color: white; border: none; border-radius: 8px;
  padding: 12px 32px; font-size: 1.1rem; cursor: pointer; height: fit-content;
}
button:disabled { background: #555; cursor: not-allowed; }
button:hover:not(:disabled) { background: #2563eb; }

.error { color: #f87171; font-size: 1rem; width: 100%; }

.viewer-panel { display: flex; flex-direction: column; gap: 32px; }

.volumes { background: #1e1e1e; border-radius: 12px; padding: 28px; }
.volumes h2 { margin-bottom: 16px; font-size: 1.2rem; }
table { width: 100%; border-collapse: collapse; font-size: 1rem; }
th, td { padding: 12px 16px; text-align: left; border-bottom: 1px solid #333; }
th { color: #aaa; font-weight: 500; }
</style>
