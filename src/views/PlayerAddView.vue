<script setup>
import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import { useRouter } from 'vue-router'

const router = useRouter()
const name = ref('')
const grade = ref('')
const loading = ref(false)
const toast = ref('')

async function submit() {
  if (!name.value || !grade.value) {
    toast.value = '名前と学年を入力してください'
    setTimeout(() => toast.value = '', 3000)
    return
  }
  loading.value = true
  try {
    const { error } = await supabase
      .from('players')
      .insert({ name: name.value, grade: parseInt(grade.value) })
    if (error) throw error
    router.push('/players')
  } catch (e) {
    console.error(e)
    toast.value = 'エラーが発生しました'
    setTimeout(() => toast.value = '', 3000)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="max-w-md mx-auto px-4 py-6">
    <div class="flex items-center mb-6 gap-2">
      <router-link to="/players" class="btn btn-sm btn-ghost">←</router-link>
      <h1 class="text-xl font-bold">選手追加</h1>
    </div>

    <div class="card bg-base-100 shadow border border-gray-200">
      <div class="card-body flex flex-col gap-4">

        <div>
          <label class="text-sm font-bold mb-1 block">名前</label>
          <input
            v-model="name"
            placeholder="例：田中太郎"
            class="input w-full border-2 border-gray-400 focus:border-primary"
          />
        </div>

        <div>
          <label class="text-sm font-bold mb-1 block">学年</label>
          <select v-model="grade" class="select w-full border-2 border-gray-400 focus:border-primary">
            <option value="">選択してください</option>
            <option v-for="g in [1,2,3,4,5,6]" :key="g" :value="g">{{ g }}年生</option>
          </select>
        </div>

        <button
          class="btn btn-primary w-full mt-2"
          :disabled="loading"
          @click="submit"
        >
          <span v-if="loading" class="loading loading-spinner loading-sm"></span>
          登録する
        </button>

      </div>
    </div>

    <div v-if="toast" class="toast toast-top toast-center z-50">
      <div class="alert alert-error">
        <span>{{ toast }}</span>
      </div>
    </div>
  </div>
</template>
