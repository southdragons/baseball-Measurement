<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../lib/supabase'
import { useRouter } from 'vue-router'

const router = useRouter()
const players = ref([])
const types = ref([])
const selectedPlayer = ref('')
const measuredAt = ref('')
const records = ref([])
const loading = ref(true)
const saving = ref(false)
const toast = ref('')

// 直近履歴
const recentRecords = ref([])
const editItem = ref(null)
const editValue = ref('')
const showEditModal = ref(false)

function formatDate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

async function fetchData() {
  loading.value = true
  const [playersRes, typesRes] = await Promise.all([
    supabase.from('players').select('*').eq('status', 'active').order('player_code'),
    supabase.from('measurement_types').select('*').order('order_index')
  ])
  if (!playersRes.error) players.value = playersRes.data || []
  if (!typesRes.error) {
    types.value = typesRes.data || []
    records.value = typesRes.data.map(t => ({
      measurement_type_id: t.id,
      name: t.name,
      unit: t.unit,
      value: ''
    }))
  }
  measuredAt.value = formatDate(new Date())
  loading.value = false
}

async function fetchRecentRecords() {
  const { data, error } = await supabase
    .from('measurements')
    .select('*, players(name, player_code), measurement_types(name, unit)')
    .order('created_at', { ascending: false })
    .limit(3)
  if (!error) recentRecords.value = data || []
}

async function save() {
  if (!selectedPlayer.value) {
    toast.value = '選手を選択してください'
    setTimeout(() => toast.value = '', 3000)
    return
  }
  const valid = records.value.filter(r => r.value !== '' && r.value !== null)
  if (!valid.length) {
    toast.value = '測定値を入力してください'
    setTimeout(() => toast.value = '', 3000)
    return
  }
  saving.value = true
  try {
    const rows = valid.map(r => ({
      player_id: selectedPlayer.value,
      measurement_type_id: r.measurement_type_id,
      value: parseFloat(r.value),
      measured_at: measuredAt.value
    }))
    const { error } = await supabase.from('measurements').insert(rows)
    if (error) throw error
    toast.value = '保存しました'
    records.value = records.value.map(r => ({ ...r, value: '' }))
    selectedPlayer.value = ''
    await fetchRecentRecords()
    setTimeout(() => toast.value = '', 3000)
  } catch (e) {
    toast.value = 'エラーが発生しました'
    setTimeout(() => toast.value = '', 3000)
  } finally {
    saving.value = false
  }
}

function openEdit(record) {
  editItem.value = record
  editValue.value = record.value
  showEditModal.value = true
}

async function saveEdit() {
  if (editValue.value === '') return
  const { error } = await supabase
    .from('measurements')
    .update({ value: parseFloat(editValue.value) })
    .eq('id', editItem.value.id)
  if (!error) {
    toast.value = '更新しました'
    setTimeout(() => toast.value = '', 3000)
    showEditModal.value = false
    fetchRecentRecords()
  }
}

async function deleteRecord(id) {
  const { error } = await supabase
    .from('measurements')
    .delete()
    .eq('id', id)
  if (!error) {
    toast.value = '削除しました'
    setTimeout(() => toast.value = '', 3000)
    showEditModal.value = false
    fetchRecentRecords()
  }
}

onMounted(async () => {
  await fetchData()
  await fetchRecentRecords()
})
</script>

<template>
  <div class="max-w-md mx-auto px-4 py-6">
    <div class="flex items-center mb-6 gap-2">
      <router-link to="/" class="btn btn-sm btn-ghost">←</router-link>
      <h1 class="text-xl font-bold">📝 測定記録入力</h1>
    </div>

    <div v-if="loading" class="text-center py-10">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>

    <div v-else class="flex flex-col gap-4">

      <div class="card bg-base-100 shadow border border-gray-200">
        <div class="card-body flex flex-col gap-3">
          <div>
            <label class="text-sm font-bold mb-1 block">選手</label>
            <select
              v-model="selectedPlayer"
              class="select w-full border-2 border-gray-400 focus:border-primary"
            >
              <option value="">選択してください</option>
              <option v-for="p in players" :key="p.id" :value="p.id">
                {{ p.player_code }} {{ p.name }}（{{ p.grade }}年）
              </option>
            </select>
          </div>
          <div>
            <label class="text-sm font-bold mb-1 block">測定日</label>
            <input
              type="date"
              v-model="measuredAt"
              class="input w-full border-2 border-gray-400 focus:border-primary"
            />
          </div>
        </div>
      </div>

      <div class="card bg-base-100 shadow border border-gray-200">
        <div class="card-body">
          <h2 class="font-bold mb-3">測定値入力</h2>
          <div v-if="!records.length" class="text-center text-gray-500 py-4">
            測定項目が登録されていません
          </div>
          <div v-for="r in records" :key="r.measurement_type_id" class="flex items-center gap-3 mb-3">
            <div class="flex-1 font-bold text-sm">{{ r.name }}</div>
            <input
              v-model="r.value"
              type="number"
              step="0.01"
              placeholder="0.00"
              class="input input-bordered w-28 text-right"
            />
            <div class="text-sm text-gray-500 w-8">{{ r.unit }}</div>
          </div>
        </div>
      </div>

      <button
        class="btn btn-primary w-full h-14 text-lg"
        :disabled="saving"
        @click="save"
      >
        <span v-if="saving" class="loading loading-spinner loading-sm"></span>
        保存する
      </button>

      <!-- 直近3件 -->
      <div v-if="recentRecords.length" class="mt-2">
        <div class="text-sm font-bold text-gray-500 mb-2">📋 直近の入力履歴</div>
        <div
          v-for="r in recentRecords"
          :key="r.id"
          class="card bg-base-100 shadow border border-gray-200 mb-2 cursor-pointer hover:shadow-md transition active:scale-95"
          @click="openEdit(r)"
        >
          <div class="card-body py-3 flex-row items-center gap-3">
            <div class="flex-1">
              <div class="text-sm font-bold">{{ r.players?.name }}</div>
              <div class="text-xs text-gray-500">{{ r.measurement_types?.name }} / {{ r.measured_at }}</div>
            </div>
            <div class="text-lg font-bold text-primary">
              {{ r.value }}<span class="text-sm font-normal text-gray-500 ml-1">{{ r.measurement_types?.unit }}</span>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- 編集モーダル -->
    <div v-if="showEditModal" class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded-xl w-80">
        <h2 class="font-bold text-lg mb-1">記録を編集</h2>
        <p class="text-sm text-gray-500 mb-4">
          {{ editItem?.players?.name }} / {{ editItem?.measurement_types?.name }}
        </p>
        <div class="flex items-center gap-2 mb-4">
          <input
            v-model="editValue"
            type="number"
            step="0.01"
            class="input input-bordered flex-1 text-right text-lg"
          />
          <span class="text-gray-500">{{ editItem?.measurement_types?.unit }}</span>
        </div>
        <div class="flex gap-2">
          <button class="btn btn-outline flex-1" @click="showEditModal = false">キャンセル</button>
          <button class="btn btn-error flex-1" @click="deleteRecord(editItem.id)">削除</button>
          <button class="btn btn-primary flex-1" @click="saveEdit">更新</button>
        </div>
      </div>
    </div>

    <div v-if="toast" class="toast toast-top toast-center z-50">
      <div class="alert alert-success">
        <span>{{ toast }}</span>
      </div>
    </div>
  </div>
</template>