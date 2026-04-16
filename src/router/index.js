import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import PlayersView from '../views/PlayersView.vue'
import PlayerAddView from '../views/PlayerAddView.vue'
import PlayerDetailView from '../views/PlayerDetailView.vue'
import MeasurementTypesView from '../views/MeasurementTypesView.vue'
import MeasurementRecordView from '../views/MeasurementRecordView.vue'
import MeasurementHistoryView from '../views/MeasurementHistoryView.vue'
import MeasurementListView from '../views/MeasurementListView.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: HomeView },
    { path: '/players', component: PlayersView },
    { path: '/players/add', component: PlayerAddView },
    { path: '/players/:id', component: PlayerDetailView },
    { path: '/measurements', component: MeasurementTypesView },
    { path: '/measurements/record', component: MeasurementRecordView },
    { path: '/measurements/list', component: MeasurementListView },
    { path: '/measurements/:playerId', component: MeasurementHistoryView },
  ],
})

export default router