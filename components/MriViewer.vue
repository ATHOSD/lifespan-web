<template>
  <div class="viewer-container">
    <canvas ref="canvas" />
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
let nv: any = null

onMounted(async () => {
  if (!canvas.value) return
  const { Niivue } = await import('@niivue/niivue')

  nv = new Niivue({
    show3Dcrosshair: true,
    backColor: [0.05, 0.05, 0.05, 1],
    crosshairColor: [1, 0, 0, 1],
    multiplanarShowRender: false,
  })
  await nv.attachToCanvas(canvas.value)
  nv.setSliceType(nv.sliceTypeMultiplanar)
  nv.opts.multiplanarLayout = 2

  if (props.mriUrl && props.segUrl) {
    await loadVolumes(props.mriUrl, props.segUrl)
  }
})

onBeforeUnmount(() => { nv = null })

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
  const dims = seg.hdr.pixDims            // [1, dx, dy, dz, ...]
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
  width: 100%;
  height: 600px;
  background: #1a1a1a;
  border-radius: 8px;
  overflow: hidden;
}
canvas { width: 100%; height: 100%; }
</style>
