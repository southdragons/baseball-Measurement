<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../lib/supabase'
import { useRouter } from 'vue-router'

const router = useRouter()
const players = ref([])
const types = ref([])
const measurements = ref([])
const loading = ref(true)

async function fetchData() {
  loading.value = true
  const [playersRes, typesRes, measurementsRes] = await Promise.all([
    supabase.from('players').select('*').eq('status', 'active').order('player_code'),
    supabase.from('measurement_types').select('*').order('order_index'),
    supabase.from('measurements').select('*').order('measured_at', { ascending: false })
  ])
  if (!playersRes.error) players.value = playersRes.data || []
  if (!typesRes.error) types.value = typesRes.data || []
  if (!measurementsRes.error) measurements.value = measurementsRes.data || []
  loading.value = false
}

// 選手ごとの最新測定データを取得
function getPlayerStats(playerId) {
  const playerMeasurements = measurements.value.filter(m => m.player_id === playerId)
  
  // 各種目の最新値を取得
  const latestByType = {}
  playerMeasurements.forEach(m => {
    if (!latestByType[m.measurement_type_id] || 
        m.measured_at > latestByType[m.measurement_type_id].measured_at) {
      latestByType[m.measurement_type_id] = m
    }
  })

  // 最終測定日
  const latestDate = playerMeasurements.length > 0
    ? playerMeasurements.reduce((a, b) => a.measured_at > b.measured_at ? a : b).measured_at
    : null

  return { latestByType, latestDate }
}

function getTypeName(id) {
  return types.value.find(t => t.id === id)?.name || ''
}

function getTypeUnit(id) {
  return types.value.find(t => t.id === id)?.unit || ''
}

onMounted(fetchData)
</script>

<template>
  <div class="max-w-md mx-auto px-4 py-6">
    <div class="flex items-center mb-6 gap-2">
      <router-link to="/" class="btn btn-sm btn-ghost">←</router-link>
      <h1 class="text-xl font-bold">📊 測定記録一覧</h1>
    </div>

    <div v-if="loading" class="text-center py-10">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>

    <div v-else class="flex flex-col gap-3">
      <div v-if="!players.length" class="text-center text-gray-500 py-10">
        選手が登録されていません
      </div>

      <div
        v-for="p in players"
        :key="p.id"
        @click="router.push(`/measurements/${p.id}`)"
        class="card bg-base-100 shadow border border-gray-200 cursor-pointer hover:shadow-md transition active:scale-95"
      >
        <div class="card-body py-3">
          <div class="flex items-center gap-2 mb-2">
            <div class="badge badge-outline font-mono">{{ p.player_code }}</div>
            <div class="font-bold">{{ p.name }}</div>
            <div class="text-xs text-gray-500">{{ p.grade }}年生</div>
            <div class="ml-auto text-gray-400">›</div>
          </div>

          <div v-if="getPlayerStats(p.id).latestDate">
            <div class="text-xs text-gray-400 mb-1">
              最終測定：{{ getPlayerStats(p.id).latestDate }}
            </div>
            <div class="flex flex-wrap gap-2">
              <div
                v-for="t in types"
                :key="t.id"
                class="bg-gray-50 rounded-lg px-2 py-1 text-center"
              >
                <div v-if="getPlayerStats(p.id).latestByType[t.id]">
                  <div class="text-xs text-gray-500">{{ getTypeName(t.id) }}</div>
                  <div class="font-bold text-primary text-sm">
                    {{ getPlayerStats(p.id).latestByType[t.id].value }}
                    <span class="text-xs font-normal text-gray-500">{{ getTypeUnit(t.id) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="text-xs text-gray-400">
            測定記録なし
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
