<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../lib/supabase'

const types = ref([])
const loading = ref(true)
const showForm = ref(false)
const editItem = ref(null)
const name = ref('')
const unit = ref('')
const toast = ref('')
const showDeleteError = ref(false)
const deleteErrorMsg = ref('')

async function fetchTypes() {
  loading.value = true
  const { data, error } = await supabase
    .from('measurement_types')
    .select('*')
    .order('order_index', { ascending: true })
  if (!error) types.value = data || []
  loading.value = false
}

function openAdd() {
  editItem.value = null
  name.value = ''
  unit.value = ''
  showForm.value = true
}

function openEdit(item) {
  editItem.value = item
  name.value = item.name
  unit.value = item.unit
  showForm.value = true
}

async function save() {
  if (!name.value || !unit.value) {
    toast.value = '項目名と単位を入力してください'
    setTimeout(() => toast.value = '', 3000)
    return
  }
  try {
    if (editItem.value) {
      const { error } = await supabase
        .from('measurement_types')
        .update({ name: name.value, unit: unit.value })
        .eq('id', editItem.value.id)
      if (error) throw error
    } else {
      const { error } = await supabase
        .from('measurement_types')
        .insert({
          name: name.value,
          unit: unit.value,
          order_index: types.value.length
        })
      if (error) throw error
    }
    toast.value = '保存しました'
    setTimeout(() => toast.value = '', 3000)
    showForm.value = false
    fetchTypes()
  } catch (e) {
    toast.value = 'エラーが発生しました'
    setTimeout(() => toast.value = '', 3000)
  }
}

async function deleteType(id) {
  // 測定記録が存在するか確認
  const { data } = await supabase
    .from('measurements')
    .select('id')
    .eq('measurement_type_id', id)
    .limit(1)

  if (data && data.length > 0) {
    deleteErrorMsg.value = 'この測定項目には記録データがあるため削除できません。先に記録データを削除してください。'
    showDeleteError.value = true
    return
  }

  const { error } = await supabase
    .from('measurement_types')
    .delete()
    .eq('id', id)
  if (!error) fetchTypes()
}

onMounted(fetchTypes)
</script>

<template>
  <div class="max-w-md mx-auto px-4 py-6">
    <div class="flex items-center mb-6 gap-2">
      <router-link to="/" class="btn btn-sm btn-ghost">←</router-link>
      <h1 class="text-xl font-bold">📏 測定項目管理</h1>
    </div>

    <button class="btn btn-primary w-full mb-4" @click="openAdd">
      ＋ 項目を追加
    </button>

    <div v-if="loading" class="text-center py-10">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>

    <div v-else>
      <div v-if="!types.length" class="text-center text-gray-500 py-10">
        測定項目が登録されていません
      </div>

      <div
        v-for="t in types"
        :key="t.id"
        class="card bg-base-100 shadow border border-gray-200 mb-3"
      >
        <div class="card-body py-3 flex-row items-center gap-3">
          <div class="flex-1">
            <div class="font-bold">{{ t.name }}</div>
            <div class="text-sm text-gray-500">単位：{{ t.unit }}</div>
          </div>
          <button class="btn btn-sm btn-outline" @click="openEdit(t)">編集</button>
          <button class="btn btn-sm btn-outline btn-error" @click="deleteType(t.id)">削除</button>
        </div>
      </div>
    </div>

    <!-- フォームモーダル -->
    <div v-if="showForm" class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded-xl w-80">
        <h2 class="font-bold text-lg mb-4">
          {{ editItem ? '項目を編集' : '項目を追加' }}
        </h2>
        <div class="flex flex-col gap-3">
          <div>
            <label class="text-sm font-bold mb-1 block">項目名</label>
            <input
              v-model="name"
              placeholder="例：50m走"
              class="input w-full border-2 border-gray-400"
            />
          </div>
          <div>
            <label class="text-sm font-bold mb-1 block">単位</label>
            <input
              v-model="unit"
              placeholder="例：秒、cm、kg"
              class="input w-full border-2 border-gray-400"
            />
          </div>
        </div>
        <div class="flex gap-2 mt-4">
          <button class="btn btn-outline flex-1" @click="showForm = false">キャンセル</button>
          <button class="btn btn-primary flex-1" @click="save">保存</button>
        </div>
      </div>
    </div>

    <!-- 削除エラーモーダル -->
    <div v-if="showDeleteError" class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded-xl w-72">
        <h2 class="font-bold text-lg mb-2">⚠️ 削除できません</h2>
        <p class="text-sm text-gray-500 mb-4">{{ deleteErrorMsg }}</p>
        <button class="btn btn-primary w-full" @click="showDeleteError = false">閉じる</button>
      </div>
    </div>

    <div v-if="toast" class="toast toast-top toast-center z-50">
      <div class="alert alert-success">
        <span>{{ toast }}</span>
      </div>
    </div>
  </div>
</template>