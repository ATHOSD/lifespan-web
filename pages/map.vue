<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">Usage Map</h1>
        <p class="page-desc">Geographic distribution of segmentation requests</p>
      </div>
      <div class="stats-row">
        <div class="stat">
          <span class="stat-num">{{ visits.length }}</span>
          <span class="stat-label">Total requests</span>
        </div>
        <div class="stat">
          <span class="stat-num">{{ uniqueCountries }}</span>
          <span class="stat-label">Countries</span>
        </div>
      </div>
    </div>

    <div class="card">
      <div ref="mapEl" class="map-container" />
    </div>

    <div v-if="!loading && visits.length === 0" class="empty-card">
      <div class="empty-icon">🗺️</div>
      <p>No visits recorded yet. Run a segmentation to see data here.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Visit {
  lat: number
  lon: number
  country: string
  city: string
  created_at: string
}

const mapEl = ref<HTMLElement | null>(null)
const visits = ref<Visit[]>([])
const loading = ref(true)

const uniqueCountries = computed(() => new Set(visits.value.map(v => v.country).filter(Boolean)).size)
const recentVisits = computed(() => visits.value.slice(0, 20))

function formatTime(ts: string) {
  const d = new Date(ts)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

onMounted(async () => {
  visits.value = await $fetch<Visit[]>('/api/visits')
  loading.value = false

  const L = (await import('leaflet')).default
  await import('leaflet/dist/leaflet.css')

  if (!mapEl.value) return

  const map = L.map(mapEl.value, {
    center: [20, 0],
    zoom: 2,
    minZoom: 2,
    maxZoom: 6,
    worldCopyJump: false,
    maxBounds: [[-90, -180], [90, 180]],
    maxBoundsViscosity: 1.0,
    zoomControl: true,
    attributionControl: true,
  })

  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '© <a href="https://carto.com">CARTO</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    subdomains: 'abcd',
    maxZoom: 19,
    noWrap: true,
  }).addTo(map)

  for (const v of visits.value) {
    if (v.lat == null || v.lon == null) continue
    L.circleMarker([v.lat, v.lon], {
      radius: 7,
      fillColor: '#7c3aed',
      color: '#ffffff',
      weight: 1.5,
      opacity: 1,
      fillOpacity: 0.75,
    })
      .bindTooltip(`${v.city ? v.city + ', ' : ''}${v.country || ''}`, { direction: 'top' })
      .addTo(map)
  }
})
</script>

<style scoped>
.page-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  margin-bottom: 28px; gap: 20px; flex-wrap: wrap;
}
.page-title { font-size: 1.75rem; font-weight: 700; letter-spacing: -0.03em; color: #1c1917; }
.page-desc { font-size: 1rem; color: #a8a29e; margin-top: 5px; }

.stats-row { display: flex; gap: 16px; }
.stat {
  display: flex; flex-direction: column; align-items: center;
  background: #ffffff; border: 1px solid #e8e4dc;
  border-radius: 12px; padding: 14px 24px;
  box-shadow: 0 1px 4px rgba(28,25,23,0.05);
  min-width: 100px;
}
.stat-num { font-size: 1.8rem; font-weight: 700; color: #7c3aed; line-height: 1; }
.stat-label { font-size: 0.75rem; color: #a8a29e; margin-top: 4px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.06em; }

.card {
  background: #ffffff;
  border: 1px solid #e8e4dc;
  border-radius: 16px;
  padding: 8px;
  box-shadow: 0 1px 4px rgba(28,25,23,0.05);
  margin-bottom: 20px;
  overflow: hidden;
}
.card-title { font-size: 1.1rem; font-weight: 600; color: #1c1917; padding: 0 8px; }

.map-container { width: 100%; height: 680px; border-radius: 10px; }

.visit-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; padding: 12px; }
.visit-table th {
  color: #a8a29e; font-weight: 600; font-size: 0.72rem;
  text-transform: uppercase; letter-spacing: 0.08em;
  padding: 6px 16px 10px; border-bottom: 1px solid #e8e4dc; text-align: left;
}
.visit-table td {
  padding: 9px 16px; color: #57534e;
  border-bottom: 1px solid #f0ede8;
}
.visit-table tbody tr:last-child td { border-bottom: none; }
.visit-table tbody tr:hover td { background: #faf9f6; }

.empty-card {
  background: #ffffff; border: 1px solid #e8e4dc;
  border-radius: 16px; padding: 60px;
  text-align: center; display: flex; flex-direction: column; align-items: center; gap: 12px;
}
.empty-icon { font-size: 2.5rem; }
.empty-card p { font-size: 0.95rem; color: #a8a29e; }
</style>
