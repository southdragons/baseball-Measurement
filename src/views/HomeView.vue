<script setup>
</script>

<template>
  <div class="max-w-md mx-auto px-4 py-8">
    <div class="text-center mb-8">
      <div class="text-4xl mb-2">⚾</div>
      <h1 class="text-2xl font-bold">野球管理アプリ</h1>
      <p class="text-gray-500 text-sm mt-1">サウスドラゴンズJ.B.C.</p>
    </div>

    <div class="flex flex-col gap-4">
      <router-link to="/players" class="card bg-base-100 shadow-md border border-gray-200 hover:shadow-lg transition">
        <div class="card-body flex-row items-center gap-4">
          <div class="text-3xl">👥</div>
          <div>
            <div class="font-bold text-lg">選手管理</div>
            <div class="text-sm text-gray-500">選手の追加・編集・卒団管理</div>
          </div>
          <div class="ml-auto text-gray-400">›</div>
        </div>
      </router-link>

      <router-link to="/measurements" class="card bg-base-100 shadow-md border border-gray-200 hover:shadow-lg transition">
        <div class="card-body flex-row items-center gap-4">
          <div class="text-3xl">📏</div>
          <div>
            <div class="font-bold text-lg">測定項目管理</div>
            <div class="text-sm text-gray-500">測定項目の追加・編集・削除</div>
          </div>
          <div class="ml-auto text-gray-400">›</div>
        </div>
      </router-link>

      <router-link to="/measurements/record" class="card bg-primary text-white shadow-md hover:shadow-lg transition">
        <div class="card-body flex-row items-center gap-4">
          <div class="text-3xl">📝</div>
          <div>
            <div class="font-bold text-lg">測定記録入力</div>
            <div class="text-sm opacity-80">選手の測定データを入力</div>
          </div>
          <div class="ml-auto">›</div>
        </div>
      </router-link>
      <router-link to="/measurements/list" class="card bg-base-100 shadow-md border border-gray-200 hover:shadow-lg transition">
        <div class="card-body flex-row items-center gap-4">
          <div class="text-3xl">📊</div>
          <div>
            <div class="font-bold text-lg">測定記録一覧</div>
            <div class="text-sm text-gray-500">選手ごとの測定記録を確認</div>
          </div>
          <div class="ml-auto text-gray-400">›</div>
        </div>
      </router-link>
    </div>
  </div>
</template>
