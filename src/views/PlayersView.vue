<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../lib/supabase'
import { useRouter } from 'vue-router'

const router = useRouter()
const players = ref([])
const loading = ref(true)
const showArchived = ref(false)

async function fetchPlayers() {
  loading.value = true
  const query = supabase
    .from('players')
    .select('*')
    .order('player_code', { ascending: true })

  if (!showArchived.value) {
    query.eq('status', 'active')
  }

  const { data, error } = await query
  if (!error) players.value = data || []
  loading.value = false
}

onMounted(fetchPlayers)
</script>

<template>
  <div class="max-w-md mx-auto px-4 py-6">
    <div class="flex items-center mb-6 gap-2">
      <router-link to="/" class="btn btn-sm btn-ghost">←</router-link>
      <h1 class="text-xl font-bold">👥 選手管理</h1>
    </div>

    <div class="flex justify-between items-center mb-4">
      <label class="flex items-center gap-2 text-sm">
        <input type="checkbox" v-model="showArchived" @change="fetchPlayers" class="checkbox checkbox-sm" />
        卒団選手を表示
      </label>
      <router-link to="/players/add" class="btn btn-primary btn-sm">
        ＋ 選手追加
      </router-link>
    </div>

    <div v-if="loading" class="text-center py-10">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>

    <div v-else>
      <div v-if="!players.length" class="text-center text-gray-500 py-10">
        選手が登録されていません
      </div>

      <div
        v-for="p in players"
        :key="p.id"
        @click="router.push(`/players/${p.id}`)"
        class="card bg-base-100 shadow border border-gray-200 mb-3 cursor-pointer hover:shadow-md transition"
      >
        <div class="card-body py-3 flex-row items-center gap-3">
          <div class="badge badge-outline font-mono text-sm">{{ p.player_code }}</div>
          <div>
            <div class="font-bold">{{ p.name }}</div>
            <div class="text-sm text-gray-500">{{ p.grade }}年生</div>
          </div>
          <div v-if="p.status === 'archived'" class="ml-auto badge badge-ghost">卒団</div>
          <div v-else class="ml-auto text-gray-400">›</div>
        </div>
      </div>
    </div>
  </div>
</template>
