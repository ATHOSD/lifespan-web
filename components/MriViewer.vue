<template>
  <div class="viewer-container">
    <canvas ref="canvas" />
    <div v-if="hoverLabel !== null" class="label-badge">
      Label {{ hoverLabel }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, watch, ref } from 'vue'

const props = defineProps<{
  mriUrl: string | null
  segUrl: string | null
}>()

const emit = defineEmits<{
  volumes: [data: { label: number; volume: number }[]]
}>()

const canvas = ref<HTMLCanvasElement | null>(null)
const hoverLabel = ref<number | null>(null)
let nv: any = null

onMounted(async () => {
  if (!canvas.value) return
  const { Niivue } = await import('@niivue/niivue')

  nv = new Niivue({
    show3Dcrosshair: true,
    backColor: [0.05, 0.05, 0.05, 1],
    crosshairColor: [1, 0, 0, 1],
    onLocationChange: handleLocation,
  })
  await nv.attachToCanvas(canvas.value)
  nv.setSliceType(nv.sliceTypeMultiplanar)

  if (props.mriUrl && props.segUrl) {
    await loadVolumes(props.mriUrl, props.segUrl)
  }
})

onBeforeUnmount(() => { nv = null })

function handleLocation(data: any) {
  if (!data?.values || data.values.length < 2) {
    hoverLabel.value = null
    return
  }
  const val = Math.round(data.values[1]?.value ?? 0)
  hoverLabel.value = val > 0 ? val : null
}

async function loadVolumes(mriUrl: string, segUrl: string) {
  if (!nv) return
  await nv.loadVolumes([
    { url: mriUrl, name: 'scan.nii.gz', colormap: 'gray' },
    { url: segUrl, name: 'seg.nii.gz', opacity: 0.7, colormap: 'random256', cal_min: 0, cal_max: 14 },
  ])
  computeVolumes()
}

function computeVolumes() {
  if (!nv || nv.volumes.length < 2) return
  const seg = nv.volumes[1]
  const img = seg.img as Float32Array
  const dims = seg.hdr.pixDims
  const voxelMm3 = dims[1] * dims[2] * dims[3]

  const counts: Record<number, number> = {}
  for (let i = 0; i < img.length; i++) {
    const label = Math.round(img[i])
    if (label > 0) counts[label] = (counts[label] || 0) + 1
  }

  const data = Object.entries(counts)
    .map(([label, count]) => ({ label: Number(label), volume: Math.round(count * voxelMm3) }))
    .sort((a, b) => a.label - b.label)

  emit('volumes', data)
}

watch(() => [props.mriUrl, props.segUrl], async ([mri, seg]) => {
  if (mri && seg) await loadVolumes(mri, seg)
})
</script>

<style scoped>
.viewer-container {
  position: relative;
  width: 100%;
  height: 600px;
  background: #1a1a1a;
  border-radius: 8px;
  overflow: hidden;
}
canvas { width: 100%; height: 100%; }

.label-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  font-size: 0.95rem;
  padding: 4px 12px;
  border-radius: 6px;
  pointer-events: none;
}
</style>
