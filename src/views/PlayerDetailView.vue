<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../lib/supabase'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
const player = ref(null)
const name = ref('')
const grade = ref('')
const loading = ref(true)
const saving = ref(false)
const toast = ref('')
const showDeleteConfirm = ref(false)

// 兄弟関連
const siblings = ref([])
const allPlayers = ref([])
const selectedSibling = ref('')
const showSiblingForm = ref(false)

async function fetchPlayer() {
  loading.value = true
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('id', route.params.id)
    .single()
  if (!error) {
    player.value = data
    name.value = data.name
    grade.value = data.grade
  }
  loading.value = false
}

async function fetchSiblings() {
  const { data, error } = await supabase
    .from('siblings')
    .select('sibling_id')
    .eq('player_id', route.params.id)

  if (!error && data.length) {
    const siblingIds = data.map(s => s.sibling_id)
    const { data: players } = await supabase
      .from('players')
      .select('*')
      .in('id', siblingIds)
    siblings.value = players || []
  } else {
    siblings.value = []
  }
}

async function fetchAllPlayers() {
  const { data } = await supabase
    .from('players')
    .select('*')
    .eq('status', 'active')
    .neq('id', route.params.id)
    .order('player_code')
  allPlayers.value = data || []
}

async function addSibling() {
  if (!selectedSibling.value) return
  try {
    await supabase.from('siblings').insert([
      { player_id: route.params.id, sibling_id: selectedSibling.value },
      { player_id: selectedSibling.value, sibling_id: route.params.id }
    ])
    toast.value = '兄弟を登録しました'
    setTimeout(() => toast.value = '', 3000)
    showSiblingForm.value = false
    selectedSibling.value = ''
    fetchSiblings()
  } catch (e) {
    toast.value = 'エラーが発生しました'
    setTimeout(() => toast.value = '', 3000)
  }
}

async function removeSibling(siblingId) {
  await supabase.from('siblings').delete()
    .eq('player_id', route.params.id).eq('sibling_id', siblingId)
  await supabase.from('siblings').delete()
    .eq('player_id', siblingId).eq('sibling_id', route.params.id)
  fetchSiblings()
}

async function save() {
  if (!name.value || !grade.value) {
    toast.value = '名前と学年を入力してください'
    setTimeout(() => toast.value = '', 3000)
    return
  }
  saving.value = true
  try {
    const { error } = await supabase
      .from('players')
      .update({ name: name.value, grade: parseInt(grade.value) })
      .eq('id', route.params.id)
    if (error) throw error
    toast.value = '保存しました'
    setTimeout(() => toast.value = '', 3000)
  } catch (e) {
    toast.value = 'エラーが発生しました'
    setTimeout(() => toast.value = '', 3000)
  } finally {
    saving.value = false
  }
}

async function archive() {
  const { error } = await supabase
    .from('players')
    .update({ status: 'archived' })
    .eq('id', route.params.id)
  if (!error) router.push('/players')
}

async function unarchive() {
  const { error } = await supabase
    .from('players')
    .update({ status: 'active' })
    .eq('id', route.params.id)
  if (!error) router.push('/players')
}

async function deletePlayer() {
  const id = route.params.id

  // 関連データを先に削除
  await supabase.from('measurements').delete().eq('player_id', id)
  await supabase.from('siblings').delete().eq('player_id', id)
  await supabase.from('siblings').delete().eq('sibling_id', id)
  await supabase.from('at_bats').delete().eq('player_id', id)
  await supabase.from('steals').delete().eq('player_id', id)
  await supabase.from('orders').delete().eq('player_id', id)

  // 選手を削除
  const { error } = await supabase
    .from('players')
    .delete()
    .eq('id', id)
  if (!error) router.push('/players')
  else {
    toast.value = '削除できませんでした'
    setTimeout(() => toast.value = '', 3000)
    showDeleteConfirm.value = false
  }
}

onMounted(async () => {
  await fetchPlayer()
  await fetchSiblings()
  await fetchAllPlayers()
})
</script>

<template>
  <div class="max-w-md mx-auto px-4 py-6">
    <div class="flex items-center mb-6 gap-2">
      <router-link to="/players" class="btn btn-sm btn-ghost">←</router-link>
      <h1 class="text-xl font-bold">選手詳細</h1>
    </div>

    <div v-if="loading" class="text-center py-10">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>

    <div v-else-if="player">

      <!-- 基本情報 -->
      <div class="card bg-base-100 shadow border border-gray-200 mb-4">
        <div class="card-body flex flex-col gap-4">
          <div class="text-center">
            <div class="badge badge-primary badge-lg font-mono text-lg px-4 py-3">
              ID: {{ player.player_code }}
            </div>
          </div>
          <div>
            <label class="text-sm font-bold mb-1 block">名前</label>
            <input v-model="name" class="input w-full border-2 border-gray-400 focus:border-primary" />
          </div>
          <div>
            <label class="text-sm font-bold mb-1 block">学年</label>
            <select v-model="grade" class="select w-full border-2 border-gray-400 focus:border-primary">
              <option v-for="g in [1,2,3,4,5,6]" :key="g" :value="g">{{ g }}年生</option>
            </select>
          </div>
          <button class="btn btn-primary w-full" :disabled="saving" @click="save">
            <span v-if="saving" class="loading loading-spinner loading-sm"></span>
            保存する
          </button>
        </div>
      </div>

      <!-- 兄弟 -->
      <div class="card bg-base-100 shadow border border-gray-200 mb-4">
        <div class="card-body">
          <div class="flex justify-between items-center mb-3">
            <h2 class="font-bold">👨‍👦 兄弟</h2>
            <button class="btn btn-sm btn-outline" @click="showSiblingForm = !showSiblingForm">
              ＋ 追加
            </button>
          </div>

          <div v-if="showSiblingForm" class="flex gap-2 mb-3">
            <select v-model="selectedSibling" class="select select-bordered flex-1">
              <option value="">選手を選択</option>
              <option
                v-for="p in allPlayers.filter(p => !siblings.find(s => s.id === p.id))"
                :key="p.id"
                :value="p.id"
              >
                {{ p.player_code }} {{ p.name }}
              </option>
            </select>
            <button class="btn btn-primary" @click="addSibling">登録</button>
          </div>

          <div v-if="!siblings.length" class="text-sm text-gray-500">兄弟未登録</div>
          <div v-for="s in siblings" :key="s.id" class="flex items-center justify-between py-2 border-b last:border-0">
            <div>
              <span class="badge badge-outline font-mono mr-2">{{ s.player_code }}</span>
              {{ s.name }}（{{ s.grade }}年）
            </div>
            <button class="btn btn-xs btn-outline btn-error" @click="removeSibling(s.id)">削除</button>
          </div>
        </div>
      </div>

      <!-- 測定記録 -->
      <div class="card bg-base-100 shadow border border-gray-200 mb-4">
        <div class="card-body">
          <h2 class="font-bold mb-3">測定記録</h2>
          <router-link :to="`/measurements/${player.id}`" class="btn btn-outline w-full">
            📊 測定履歴を見る
          </router-link>
        </div>
      </div>

      <!-- その他操作 -->
      <div class="card bg-base-100 shadow border border-gray-200">
        <div class="card-body flex flex-col gap-3">
          <h2 class="font-bold text-gray-500">その他の操作</h2>
          <button v-if="player.status === 'active'" class="btn btn-outline btn-warning w-full" @click="archive">
            🎓 卒団にする
          </button>
          <button v-else class="btn btn-outline btn-success w-full" @click="unarchive">
            🔄 現役に戻す
          </button>
          <button class="btn btn-outline btn-error w-full" @click="showDeleteConfirm = true">
            🗑️ 削除する
          </button>
        </div>
      </div>
    </div>

    <!-- 削除確認モーダル -->
    <div v-if="showDeleteConfirm" class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded-xl w-72">
        <h2 class="font-bold text-lg mb-2">本当に削除しますか？</h2>
        <p class="text-sm text-gray-500 mb-4">この操作は取り消せません。</p>
        <div class="flex gap-2">
          <button class="btn btn-outline flex-1" @click="showDeleteConfirm = false">キャンセル</button>
          <button class="btn btn-error flex-1" @click="deletePlayer">削除</button>
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