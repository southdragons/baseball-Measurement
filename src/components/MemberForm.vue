<script setup>
defineProps(['members'])
const emit = defineEmits(['add','update','remove'])
</script>

<template>
  <div>

    <div
      v-for="(m, i) in members"
      :key="m.id"
      class="card bg-base-100 shadow mb-4"
    >
      <div class="card-body">

        <div class="font-bold text-lg mb-2">
          {{ i + 1 }}人目
        </div>

        <input
          v-model="m.name"
          placeholder="名前を入力"
          class="input input-bordered w-full text-lg mt-1 bg-white"
        />

        <div class="grid grid-cols-2 gap-2">

          <button
            class="h-14 text-lg font-bold border-2 rounded-lg flex items-center justify-center active:scale-95 transition"
            :class="m.status === '欠席'
              ? 'bg-red-500 text-white border-red-500'
              : 'bg-white border-gray-300 text-gray-500'"
            @click="emit('update', m.id, 'status', '欠席')"
          >
            ❌ 欠席
          </button>

          <button
            class="h-14 text-lg font-bold border-2 rounded-lg flex flex-col items-center justify-center active:scale-95 transition"
            :class="m.status === '10時以降参加'
              ? 'bg-yellow-400 text-white border-yellow-400'
              : 'bg-white border-gray-300 text-gray-500'"
            @click="emit('update', m.id, 'status', '10時以降参加')"
          >
            ⏰ 10時以降参加
            <span class="text-xs font-normal">対象：小3以下</span>
          </button>


        </div>

        <button
          v-if="members.length > 1"
          class="btn btn-sm btn-error mt-3"
          @click="emit('remove', m.id)"
        >
          削除
        </button>

      </div>
    </div>

    <button
      class="btn btn-outline w-full h-14 text-lg mt-2"
      @click="emit('add')"
    >
      ＋ 兄弟を追加
    </button>

  </div>
</template>