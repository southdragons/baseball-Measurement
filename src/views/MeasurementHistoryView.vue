<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../lib/supabase'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const player = ref(null)
const siblings = ref([])
const types = ref([])
const measurements = ref([])
const loading = ref(true)

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
    .order('measured_at', { ascending: false })
  measurements.value = measurementsData || []

  loading.value = false
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
  measurements.value.forEach(m => {
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
      <div v-if="player" class="card bg-primary text-white shadow mb-4">
        <div class="card-body py-3 flex-row items-center gap-3">
          <div class="badge badge-outline badge-lg font-mono">{{ player.player_code }}</div>
          <div>
            <div class="font-bold text-lg">{{ player.name }}</div>
            <div class="text-sm opacity-80">{{ player.grade }}年生</div>
          </div>
        </div>
      </div>

      <div v-if="siblings.length" class="flex gap-2 mb-4 flex-wrap">
        <div v-for="s in siblings" :key="s.id" class="badge badge-outline gap-1">
          {{ s.player_code }} {{ s.name }}（{{ s.grade }}年）
        </div>
      </div>

      <div v-if="!measurements.length" class="text-center text-gray-500 py-10">
        測定記録がありません
      </div>

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
</template>