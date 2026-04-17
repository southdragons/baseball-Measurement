<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { supabase } from '../lib/supabase'
import { useRoute, useRouter } from 'vue-router'
import { Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend } from 'chart.js'

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend)

const route = useRoute()
const router = useRouter()
const player = ref(null)
const siblings = ref([])
const types = ref([])
const measurements = ref([])
const loading = ref(true)
const activeTab = ref('chart')
const charts = ref({})

async function fetchData() {
  loading.value = true

  const { data: playerData } = await supabase
    .from('players')
    .select('*')
    .eq('id', route.params.playerId)
    .single()
  player.value = playerData

  const { data: siblingData } = await supabase
    .from('siblings')
    .select('sibling_id')
    .eq('player_id', route.params.playerId)

  let siblingIds = []
  if (siblingData && siblingData.length) {
    siblingIds = siblingData.map(s => s.sibling_id)
    const { data: siblingPlayers } = await supabase
      .from('players')
      .select('*')
      .in('id', siblingIds)
    siblings.value = siblingPlayers || []
  }

  const { data: typesData } = await supabase
    .from('measurement_types')
    .select('*')
    .order('order_index')
  types.value = typesData || []

  const allIds = [route.params.playerId, ...siblingIds]

  const { data: measurementsData } = await supabase
    .from('measurements')
    .select('*')
    .in('player_id', allIds)
    .order('measured_at', { ascending: true })
  measurements.value = measurementsData || []

  loading.value = false
  await nextTick()
  renderCharts()
}

function goBack() {
  const back = window.history.state?.back || ''
  if (back.includes('/measurements/list')) {
    router.push('/measurements/list')
  } else {
    router.push(`/players/${route.params.playerId}`)
  }
}

function groupByDate() {
  const grouped = {}
  const sorted = [...measurements.value].sort((a, b) => b.measured_at.localeCompare(a.measured_at))
  sorted.forEach(m => {
    if (!grouped[m.measured_at]) grouped[m.measured_at] = []
    grouped[m.measured_at].push(m)
  })
  return grouped
}

function getTypeName(id) {
  return types.value.find(t => t.id === id)?.name || ''
}

function getTypeUnit(id) {
  return types.value.find(t => t.id === id)?.unit || ''
}

function getPlayerName(id) {
  if (id === route.params.playerId) return player.value?.name || ''
  return siblings.value.find(s => s.id === id)?.name || ''
}

function getChartDataByType(typeId) {
  const data = measurements.value
    .filter(m => m.measurement_type_id === typeId)
    .sort((a, b) => a.measured_at.localeCompare(b.measured_at))
  return {
    labels: data.map(m => m.measured_at),
    values: data.map(m => m.value)
  }
}

function getStats(typeId) {
  const data = measurements.value.filter(m => m.measurement_type_id === typeId)
  if (!data.length) return null
  const values = data.map(m => parseFloat(m.value))
  const max = Math.max(...values)
  const min = Math.min(...values)
  const avg = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2)
  const latest = [...data].sort((a, b) => b.measured_at.localeCompare(a.measured_at))[0]
  return { max, min, avg, latest: latest.value }
}

function renderCharts() {
  types.value.forEach(type => {
    const canvas = document.getElementById(`chart-${type.id}`)
    if (!canvas) return
    const chartData = getChartDataByType(type.id)
    if (!chartData.values.length) return
    if (charts.value[type.id]) {
      charts.value[type.id].destroy()
    }
    charts.value[type.id] = new Chart(canvas, {
      type: 'line',
      data: {
        labels: chartData.labels,
        datasets: [{
          label: type.name,
          data: chartData.values,
          borderColor: '#570DF8',
          backgroundColor: 'rgba(87, 13, 248, 0.1)',
          pointBackgroundColor: '#570DF8',
          pointRadius: 5,
          tension: 0.3,
          fill: true
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.parsed.y} ${type.unit}`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: false,
            ticks: {
              callback: (val) => `${parseFloat(val.toFixed(2))}${type.unit}`
            }
          },
          x: {
            ticks: {
              maxRotation: 45
            }
          }
        }
      }
    })
  })
}

async function switchTab(tab) {
  activeTab.value = tab
  if (tab === 'chart') {
    await nextTick()
    renderCharts()
  }
}

onMounted(fetchData)
</script>

<template>
  <div class="max-w-md mx-auto px-4 py-6">
    <div class="flex items-center mb-6 gap-2">
      <button @click="goBack" class="btn btn-sm btn-ghost">←</button>
      <h1 class="text-xl font-bold">📊 測定履歴</h1>
    </div>

    <div v-if="loading" class="text-center py-10">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>

    <div v-else>
      <!-- 選手情報 -->
      <div v-if="player" class="card bg-primary text-white shadow mb-4">
        <div class="card-body py-3 flex-row items-center gap-3">
          <div class="badge badge-outline badge-lg font-mono">{{ player.player_code }}</div>
          <div>
            <div class="font-bold text-lg">{{ player.name }}</div>
            <div class="text-sm opacity-80">{{ player.grade }}年生</div>
          </div>
        </div>
      </div>

      <!-- 兄弟バッジ -->
      <div v-if="siblings.length" class="flex gap-2 mb-4 flex-wrap">
        <div v-for="s in siblings" :key="s.id" class="badge badge-outline gap-1">
          {{ s.player_code }} {{ s.name }}（{{ s.grade }}年）
        </div>
      </div>

      <!-- タブ切り替え -->
      <div class="flex gap-2 mb-4">
        <button
          class="flex-1 py-3 rounded-lg font-bold text-sm transition"
          :class="activeTab === 'chart'
            ? 'bg-primary text-white shadow-md'
            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'"
          @click="switchTab('chart')"
        >📈 グラフ</button>
        <button
          class="flex-1 py-3 rounded-lg font-bold text-sm transition"
          :class="activeTab === 'table'
            ? 'bg-primary text-white shadow-md'
            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'"
          @click="switchTab('table')"
        >📋 一覧</button>
      </div>

      <div v-if="!measurements.length" class="text-center text-gray-500 py-10">
        測定記録がありません
      </div>

      <!-- グラフ表示 -->
      <div v-if="activeTab === 'chart'">
        <div v-for="type in types" :key="type.id" class="mb-6">
          <div v-if="measurements.some(m => m.measurement_type_id === type.id)">
            <div class="card bg-base-100 shadow border border-gray-200">
              <div class="card-body py-3">
                <h2 class="font-bold mb-1">{{ type.name }}（{{ type.unit }}）</h2>
                <!-- 統計 -->
                <div v-if="getStats(type.id)" class="grid grid-cols-4 gap-1 text-center mb-3">
                  <div class="bg-gray-50 rounded p-1">
                    <div class="text-xs text-gray-500">最新</div>
                    <div class="font-bold text-primary text-sm">{{ getStats(type.id).latest }}</div>
                  </div>
                  <div class="bg-gray-50 rounded p-1">
                    <div class="text-xs text-gray-500">最高</div>
                    <div class="font-bold text-success text-sm">{{ getStats(type.id).max }}</div>
                  </div>
                  <div class="bg-gray-50 rounded p-1">
                    <div class="text-xs text-gray-500">最低</div>
                    <div class="font-bold text-error text-sm">{{ getStats(type.id).min }}</div>
                  </div>
                  <div class="bg-gray-50 rounded p-1">
                    <div class="text-xs text-gray-500">平均</div>
                    <div class="font-bold text-sm">{{ getStats(type.id).avg }}</div>
                  </div>
                </div>
                <!-- グラフ -->
                <canvas :id="`chart-${type.id}`" height="200"></canvas>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 一覧表示 -->
      <div v-if="activeTab === 'table'">
        <div v-for="(records, date) in groupByDate()" :key="date" class="mb-4">
          <div class="text-sm font-bold text-gray-500 mb-2">📅 {{ date }}</div>
          <div class="card bg-base-100 shadow border border-gray-200">
            <div class="card-body py-3">
              <div
                v-for="r in records"
                :key="r.id"
                class="flex items-center justify-between py-2 border-b last:border-0"
              >
                <div>
                  <div class="text-sm font-bold">{{ getTypeName(r.measurement_type_id) }}</div>
                  <div class="text-xs text-gray-400">{{ getPlayerName(r.player_id) }}</div>
                </div>
                <div class="text-lg font-bold text-primary">
                  {{ r.value }}<span class="text-sm font-normal text-gray-500 ml-1">{{ getTypeUnit(r.measurement_type_id) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>