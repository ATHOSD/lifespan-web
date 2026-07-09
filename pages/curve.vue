<template>
  <div class="page">

    <!-- Header + controls -->
    <div class="page-top">
      <div>
        <h1 class="page-title">Growth Curve</h1>
        <p class="page-desc">Normative brain development trajectories</p>
      </div>
      <div class="controls">
        <select v-model="selectedMeasure" class="measure-sel">
          <option v-for="m in MEASURES" :key="m" :value="m">{{ MEASURE_LABELS[m] }}</option>
        </select>
        <div class="sex-btns">
          <button :class="['sex-btn', { active: selectedSex === 'Male' }]" @click="selectedSex = 'Male'">♂ Male</button>
          <button :class="['sex-btn', { active: selectedSex === 'Female' }]" @click="selectedSex = 'Female'">♀ Female</button>
        </div>
      </div>
    </div>

    <!-- Two-column layout -->
    <div class="curve-layout">

      <!-- Left: subject list -->
      <div class="subject-panel">
        <div class="subject-hd">
          Subjects
          <span class="subject-count">{{ subjects.length }}</span>
        </div>

        <div v-if="subjects.length === 0" class="list-empty">
          <div class="list-empty-icon">
            <svg viewBox="0 0 40 40" fill="none" width="36" height="36">
              <path d="M4 32L12 22l8 6L28 12l10-6" stroke="#d6d3cd" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M28 4v8M24 8h8" stroke="#d6d3cd" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
          <p>Use <strong>Add to Curve</strong> on segmentation results to add subjects.</p>
        </div>

        <div
          v-for="s in subjects" :key="s.id"
          class="subject-item"
          :class="{ highlighted: hoveredId === s.id, 'item-hidden': subjectStatus(s) !== 'visible' }"
          @mouseenter="hoveredId = s.id"
          @mouseleave="hoveredId = null"
        >
          <div class="subj-dot" :style="{ background: subjectStatus(s) === 'visible' ? s.color : '#d6d3cd' }" />
          <div class="subj-info">
            <div class="subj-name">{{ s.name }}</div>
            <div class="subj-meta">{{ s.ageLabel }} · {{ s.sex }}</div>
            <div v-if="subjectStatus(s) === 'visible'" class="subj-scores">
              <span class="score-centile">{{ formatCentile(computeCentile(s, selectedMeasure)) }}</span>
              <span class="score-ndi" title="Global NDI">G {{ formatNDI(computeNDI(s, GLOBAL_MEASURES)) }}</span>
              <span class="score-ndi" title="Subcortical NDI">S {{ formatNDI(computeNDI(s, SUBCORTICAL_MEASURES)) }}</span>
            </div>
            <div v-if="subjectStatus(s) === 'wrong-sex'" class="subj-hidden-reason">not on {{ selectedSex }} chart</div>
          </div>
          <button class="subj-remove" @click="removeSubject(s.id)" title="Remove">
            <svg viewBox="0 0 14 14" fill="none" width="11" height="11">
              <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
            </svg>
          </button>
        </div>

        <div v-if="noVolumeData && subjects.length > 0" class="no-data-note">
          <svg viewBox="0 0 16 16" fill="none" width="13" height="13" style="flex-shrink:0">
            <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.4"/>
            <path d="M8 5v4M8 10.5h.01" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
          </svg>
          Volume mapping needed to overlay subject dots
        </div>
      </div>

      <!-- Right: Plotly chart -->
      <div class="chart-panel">
        <div v-if="!volRef" class="chart-loading">
          <div class="spinner" />
          Loading reference data…
        </div>
        <div ref="chartEl" class="chart-el" />
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { computePCD, formatAgeLabel, useCurveStore, type CurveSubject } from '~/composables/useCurveStore'

const MEASURES = [
  'GMV', 'WMV', 'Ventricles', 'CBM', 'BS', 'Subcortical',
  'Hippocampus', 'Amygdala', 'Caudate', 'Putamen',
  'Pallidum', 'Accumbens', 'Thalamus', 'Ventral-DC',
]
const MEASURE_LABELS: Record<string, string> = {
  GMV: 'Gray Matter Volume (GMV)',
  WMV: 'White Matter Volume (WMV)',
  Ventricles: 'Ventricles',
  CBM: 'Cerebellum (CBM)',
  BS: 'Brainstem (BS)',
  Subcortical: 'Subcortical Volume',
  Hippocampus: 'Hippocampus',
  Amygdala: 'Amygdala',
  Caudate: 'Caudate',
  Putamen: 'Putamen',
  Pallidum: 'Pallidum',
  Accumbens: 'Accumbens',
  Thalamus: 'Thalamus',
  'Ventral-DC': 'Ventral Diencephalon',
}

// Segmentation label → volume for a given measure
// Label mapping: 1=Ventricles, 2=GM, 3=WM, 4=Hippocampus, 5=Amygdala,
// 6=Caudate, 7=Putamen, 8=Pallidum, 9=Thalamus, 10=Accumbens,
// 11=CBM_Cortex, 12=CBM_WM, 13=Brainstem, 14=Ventral_DC

const MAX_PCD = 280 + 85 * 365.25  // 85 years postnatal

// Centile interpolation grid (23 quantile levels)
const P_GRID = [0.005,0.025,0.05,0.10,0.15,0.20,0.25,0.30,0.35,0.40,0.45,0.50,0.55,0.60,0.65,0.70,0.75,0.80,0.85,0.90,0.95,0.975,0.995]
const C_KEYS = ['c005','c025','c050','c100','c150','c200','c250','c300','c350','c400','c450','c500','c550','c600','c650','c700','c750','c800','c850','c900','c950','c975','c995']
const GLOBAL_MEASURES    = ['GMV','WMV','Ventricles','CBM','BS','Subcortical']
const SUBCORTICAL_MEASURES = ['Hippocampus','Amygdala','Caudate','Putamen','Pallidum','Accumbens','Thalamus']

// Inverse normal CDF — Peter Acklam's rational approximation (~9-digit accuracy)
function qnorm(p: number): number {
  if (p <= 0) return -Infinity
  if (p >= 1) return  Infinity
  const a = [-3.969683028665376e+01,2.209460984245205e+02,-2.759285104469687e+02,1.383577518672690e+02,-3.066479806614716e+01,2.506628277459239e+00]
  const b = [-5.447609879822406e+01,1.615858368580409e+02,-1.556989798598866e+02,6.680131188771972e+01,-1.328068155288572e+01]
  const c = [-7.784894002430293e-03,-3.223964580411365e-01,-2.400758277161838e+00,-2.549732539343734e+00,4.374664141464968e+00,2.938163982698783e+00]
  const d = [7.784695709041462e-03,3.224671290700398e-01,2.445134137142996e+00,3.754408661907416e+00]
  const pLow = 0.02425
  if (p < pLow) {
    const q = Math.sqrt(-2*Math.log(p))
    return (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])/((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1)
  }
  if (p <= 1-pLow) {
    const q = p-0.5, r = q*q
    return (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q/(((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1)
  }
  const q = Math.sqrt(-2*Math.log(1-p))
  return -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])/((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1)
}

function estimateCentile(logAge: number, sexRef: any, volume: number): number | null {
  const logAges: number[] = sexRef.logAge
  if (!logAges?.length) return null
  // Find interpolation bracket
  let lo = 0, hi = logAges.length - 1
  while (lo < hi - 1) { const mid = (lo+hi)>>1; if (logAges[mid] <= logAge) lo=mid; else hi=mid }
  const t = logAges[hi]===logAges[lo] ? 0 : (logAge-logAges[lo])/(logAges[hi]-logAges[lo])
  // Build quantile vector at this age
  const qVec: number[] = [], pGrid: number[] = []
  for (let i = 0; i < C_KEYS.length; i++) {
    const arr: number[] = sexRef[C_KEYS[i]]
    if (!arr) continue
    const q = arr[lo] + t*(arr[hi]-arr[lo])
    if (isFinite(q)) { qVec.push(q); pGrid.push(P_GRID[i]) }
  }
  if (qVec.length < 2) return null
  if (volume <= qVec[0]) return pGrid[0]
  if (volume >= qVec[qVec.length-1]) return pGrid[pGrid.length-1]
  for (let j = 0; j < qVec.length-1; j++) {
    if (volume >= qVec[j] && volume < qVec[j+1]) {
      return pGrid[j] + (pGrid[j+1]-pGrid[j])*(volume-qVec[j])/(qVec[j+1]-qVec[j])
    }
  }
  return null
}

function computeCentile(s: CurveSubject, measure: string): number | null {
  if (!volRef.value || s.postConceptionDays === null) return null
  const sexKey = s.sex === 'Female' ? 'Female' : 'Male'
  const ref = volRef.value[measure]?.[sexKey]
  if (!ref?.logAge) return null
  const vol = getVolume(s, measure)
  if (vol === null) return null
  return estimateCentile(Math.log(s.postConceptionDays), ref, vol)
}

function computeNDI(s: CurveSubject, measures: string[]): number | null {
  if (s.sex === 'Unknown' || s.postConceptionDays === null) return null
  const zScores: number[] = []
  for (const m of measures) {
    const c = computeCentile(s, m)
    if (c === null) continue
    const z = qnorm(Math.max(1e-6, Math.min(1-1e-6, c)))
    if (isFinite(z)) zScores.push(z)
  }
  if (zScores.length < 2) return null
  return Math.sqrt(zScores.reduce((a, z) => a+z*z, 0) / zScores.length)
}

function formatCentile(c: number | null): string {
  if (c === null) return '—'
  const pct = Math.round(c * 100)
  return `P${pct}`
}

function formatNDI(n: number | null): string {
  return n === null ? '—' : n.toFixed(2)
}

const AGE_TICKS = {
  vals:  [147, 196, 245, 280, 395, 645, 1825, 3650, 7300, 14600, 25550, Math.round(MAX_PCD)],
  texts: ['21w GA', '28w GA', '35w GA', 'Birth', '4m', '1y', '5y', '10y', '20y', '40y', '70y', '85y'],
}

const { subjects, removeSubject } = useCurveStore()

const selectedMeasure = ref('GMV')
const selectedSex = ref<'Male' | 'Female'>('Male')
const hoveredId = ref<string | null>(null)
const chartEl = ref<HTMLDivElement | null>(null)
const volRef = ref<any>(null)

const noVolumeData = computed(() =>
  subjects.value.length > 0 &&
  subjects.value.every(s => getVolume(s, selectedMeasure.value) === null),
)

function subjectStatus(s: CurveSubject): 'visible' | 'wrong-sex' | 'no-data' {
  if (s.sex !== 'Unknown' && s.sex !== selectedSex.value) return 'wrong-sex'
  if (s.postConceptionDays === null || getVolume(s, selectedMeasure.value) === null) return 'no-data'
  return 'visible'
}

function getVolume(s: CurveSubject, measure: string): number | null {
  const lbl = (n: number) => s.volumes.find(v => v.label === n)?.volume ?? null
  // Bilateral structures: segmentation gives L+R sum, brainchart reference uses per-hemisphere → divide by 2
  const half = (n: number) => { const v = lbl(n); return v !== null ? v / 2 : null }
  switch (measure) {
    case 'GMV':        return lbl(2)
    case 'WMV':        return lbl(3)
    case 'Ventricles': return lbl(1)
    case 'BS':         return lbl(13)
    case 'Hippocampus': return half(4)
    case 'Amygdala':   return half(5)
    case 'Caudate':    return half(6)
    case 'Putamen':    return half(7)
    case 'Pallidum':   return half(8)
    case 'Thalamus':   return half(9)
    case 'Accumbens':  return half(10)
    case 'Ventral-DC': return half(14)
    case 'CBM': {
      const cx = lbl(11), wm = lbl(12)
      return cx !== null && wm !== null ? cx + wm : null
    }
    case 'Subcortical': {
      // brainchart Subcortical = L+R sum of 7 structures (Ventral-DC excluded)
      const parts = [4, 5, 6, 7, 8, 9, 10].map(lbl)
      return parts.every(v => v !== null) ? parts.reduce((a, b) => a! + b!, 0)! : null
    }
    default: return null
  }
}

let Plotly: any = null

function pcdToAgeLabel(pcd: number): string {
  if (pcd < 280) {
    return `${(pcd / 7).toFixed(0)}w GA`
  }
  const postnatal = pcd - 280
  if (postnatal < 365) {
    return `${(postnatal / 30.44).toFixed(1)} mo`
  }
  return `${(postnatal / 365.25).toFixed(1)} y`
}

function buildBandTraces(sexKey: string, r: number, g: number, b: number) {
  const d = volRef.value?.[selectedMeasure.value]?.[sexKey]
  if (!d) return []

  // Clip data to MAX_PCD so the curve never extends beyond 85y
  const idx = (d.pcd as number[]).reduce((acc: number[], v, i) => { if (v <= MAX_PCD) acc.push(i); return acc }, [])
  const pcd  = idx.map((i: number) => d.pcd[i])
  const c005 = idx.map((i: number) => d.c005[i])
  const c025 = idx.map((i: number) => d.c025[i])
  const c500 = idx.map((i: number) => d.c500[i])
  const c975 = idx.map((i: number) => d.c975[i])
  const c995 = idx.map((i: number) => d.c995[i])
  const ageLabels = pcd.map(pcdToAgeLabel)

  const fill1 = `rgba(${r},${g},${b},0.08)`
  const fill2 = `rgba(${r},${g},${b},0.15)`
  const line  = `rgba(${r},${g},${b},0.65)`
  return [
    { x: pcd, y: c005, mode: 'lines', line: { color: 'transparent' }, showlegend: false, hoverinfo: 'skip' },
    { x: pcd, y: c995, mode: 'lines', fill: 'tonexty', fillcolor: fill1, line: { color: 'transparent' }, name: `${sexKey} 0.5–99.5th`, legendgroup: sexKey, hoverinfo: 'skip' },
    { x: pcd, y: c025, mode: 'lines', line: { color: 'transparent' }, showlegend: false, hoverinfo: 'skip', legendgroup: sexKey },
    { x: pcd, y: c975, mode: 'lines', fill: 'tonexty', fillcolor: fill2, line: { color: 'transparent' }, name: `${sexKey} 2.5–97.5th`, legendgroup: sexKey, hoverinfo: 'skip' },
    {
      x: pcd, y: c500, mode: 'lines',
      line: { color: line, width: 1.5 },
      name: `${sexKey} 50th`, legendgroup: sexKey,
      customdata: ageLabels,
      hovertemplate: 'Age: %{customdata}<br>Volume: %{y:.0f} mm³<extra>%{fullData.name}</extra>',
    },
  ]
}

function drawChart() {
  if (!Plotly || !chartEl.value || !volRef.value) return

  const traces: any[] = []
  if (selectedSex.value === 'Male')   traces.push(...buildBandTraces('Male',   124, 58,  237))
  if (selectedSex.value === 'Female') traces.push(...buildBandTraces('Female', 236, 72,  153))

  for (const s of subjects.value) {
    if (s.sex !== 'Unknown' && s.sex !== selectedSex.value) continue
    const vol = getVolume(s, selectedMeasure.value)
    if (vol === null || s.postConceptionDays === null) continue
    traces.push({
      x: [s.postConceptionDays],
      y: [vol],
      mode: 'markers',
      type: 'scatter',
      name: s.name,
      showlegend: false,
      text: [`<b>${s.name}</b><br>${s.ageLabel}<br>${s.sex}`],
      hovertemplate: '%{text}<br>Volume: %{y:.0f} mm³<extra></extra>',
      marker: { color: s.color, size: 11, line: { color: 'white', width: 2 } },
    })
  }

  const layout: any = {
    margin: { t: 20, r: 24, b: 80, l: 80 },
    plot_bgcolor: '#ffffff',
    paper_bgcolor: '#ffffff',
    xaxis: {
      title: { text: 'Age', standoff: 14 },
      type: 'log',
      tickvals: AGE_TICKS.vals,
      ticktext: AGE_TICKS.texts,
      range: [Math.log10(147), Math.log10(MAX_PCD)],
      autorange: false,
      showgrid: true, gridcolor: '#f0ede8',
      linecolor: '#e8e4dc', tickfont: { size: 11 },
      tickangle: -30,
    },
    yaxis: {
      title: { text: `${selectedMeasure.value} (mm³)`, standoff: 14 },
      showgrid: true, gridcolor: '#f0ede8',
      linecolor: '#e8e4dc', tickfont: { size: 11 },
      rangemode: 'tozero',
    },
    showlegend: true,
    legend: {
      x: 0.01, y: 0.99,
      bgcolor: 'rgba(255,255,255,0.92)',
      bordercolor: '#e8e4dc', borderwidth: 1,
      font: { size: 11, color: '#57534e' },
      itemclick: false,
      itemdoubleclick: false,
    },
    hovermode: 'closest',
    font: { family: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif', size: 12, color: '#57534e' },
  }

  Plotly.react(chartEl.value, traces, layout, {
    responsive: true,
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: ['lasso2d', 'select2d', 'toggleSpikelines', 'hoverCompareCartesian'],
  })
}

onMounted(async () => {
  const [P, ref] = await Promise.all([
    import('plotly.js-dist-min'),
    fetch('/vol_ref.json').then(r => r.json()),
  ])
  Plotly = P
  volRef.value = ref
  await nextTick()
  drawChart()
})

watch([selectedMeasure, selectedSex, subjects], () => {
  drawChart()
}, { deep: true })
</script>

<style scoped>
.page {
  display: flex; flex-direction: column;
  height: calc(100vh - 68px - 64px);
}

/* ── Top bar ── */
.page-top {
  display: flex; align-items: flex-start; justify-content: space-between;
  margin-bottom: 20px; gap: 16px; flex-shrink: 0;
}
.page-title { font-size: 1.75rem; font-weight: 700; letter-spacing: -0.03em; color: #1c1917; }
.page-desc { font-size: 1rem; color: #a8a29e; margin-top: 5px; }

.controls { display: flex; align-items: center; gap: 10px; flex-shrink: 0; margin-top: 4px; }
.measure-sel {
  background: #ffffff; border: 1px solid #d6d3cd; border-radius: 9px;
  color: #1c1917; padding: 9px 13px; font-size: 0.9rem; cursor: pointer;
  font-family: inherit;
}
.measure-sel:focus { outline: none; border-color: #7c3aed; box-shadow: 0 0 0 3px rgba(124,58,237,0.08); }

.sex-btns { display: flex; gap: 4px; }
.sex-btn {
  background: #faf9f6; border: 1px solid #e8e4dc; border-radius: 7px;
  padding: 8px 14px; font-size: 0.85rem; font-weight: 500; color: #78716c;
  cursor: pointer; transition: all 0.15s; font-family: inherit;
}
.sex-btn:hover { background: #ede9e3; }
.sex-btn.active { background: #ede9fe; border-color: #ddd6fe; color: #7c3aed; font-weight: 600; }

/* ── Two-column grid ── */
.curve-layout {
  flex: 1; min-height: 0;
  display: grid;
  grid-template-columns: 230px 1fr;
  gap: 16px;
}

/* ── Subject panel ── */
.subject-panel {
  background: #ffffff; border: 1px solid #e8e4dc; border-radius: 14px;
  display: flex; flex-direction: column; overflow: hidden;
  box-shadow: 0 1px 4px rgba(28,25,23,0.04);
}

.subject-hd {
  display: flex; align-items: center; gap: 8px;
  padding: 14px 16px 12px;
  font-size: 0.72rem; font-weight: 700; color: #a8a29e;
  text-transform: uppercase; letter-spacing: 0.1em;
  border-bottom: 1px solid #f0ede8; flex-shrink: 0;
}
.subject-count {
  margin-left: auto; background: #f0ede8; color: #78716c;
  border-radius: 999px; font-size: 0.7rem; font-weight: 700; padding: 1px 8px;
}

.list-empty {
  padding: 24px 16px; display: flex; flex-direction: column;
  align-items: center; gap: 12px; text-align: center; flex: 1;
  justify-content: center;
}
.list-empty-icon { opacity: 0.6; }
.list-empty p { font-size: 0.82rem; color: #a8a29e; line-height: 1.6; }
.list-empty strong { color: #7c3aed; }

.subject-item {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 14px; border-bottom: 1px solid #f5f3ef;
  transition: background 0.12s; cursor: default;
}
.subject-item:last-of-type { border-bottom: none; }
.subject-item.highlighted, .subject-item:hover { background: #faf9f6; }

.subj-dot {
  width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0;
  box-shadow: 0 0 0 2px rgba(0,0,0,0.08);
}
.subj-info { flex: 1; min-width: 0; }
.subj-name {
  font-size: 0.82rem; font-weight: 500; color: #1c1917;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.subj-meta { font-size: 0.72rem; color: #a8a29e; margin-top: 1px; }
.subj-hidden-reason { font-size: 0.68rem; color: #c4bfb8; margin-top: 2px; font-style: italic; }

.subj-scores { display: flex; gap: 4px; margin-top: 4px; flex-wrap: wrap; }
.score-centile, .score-ndi {
  font-size: 0.68rem; font-weight: 600; padding: 1px 5px;
  border-radius: 4px; white-space: nowrap;
}
.score-centile { background: #ede9fe; color: #7c3aed; }
.score-ndi { background: #f0ede8; color: #78716c; }
.item-hidden { opacity: 0.55; }

.subj-remove {
  display: flex; align-items: center; justify-content: center;
  width: 22px; height: 22px; border-radius: 5px;
  background: transparent; border: none; color: #c4bfb8;
  cursor: pointer; flex-shrink: 0; transition: all 0.12s;
}
.subj-remove:hover { background: #fef2f2; color: #dc2626; }

.no-data-note {
  display: flex; align-items: flex-start; gap: 7px;
  margin: 12px 14px; padding: 10px 12px;
  background: #fef9ec; border: 1px solid #fde68a; border-radius: 8px;
  font-size: 0.74rem; color: #92400e; line-height: 1.5;
}

/* ── Chart panel ── */
.chart-panel {
  background: #ffffff; border: 1px solid #e8e4dc; border-radius: 14px;
  position: relative; min-height: 0;
  box-shadow: 0 1px 4px rgba(28,25,23,0.04);
  overflow: hidden;
}

.chart-loading {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  gap: 10px; font-size: 0.9rem; color: #a8a29e;
}
.spinner {
  width: 18px; height: 18px;
  border: 2px solid #e8e4dc; border-top-color: #7c3aed;
  border-radius: 50%; animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.chart-el { width: 100%; height: 100%; min-height: 480px; }
</style>
