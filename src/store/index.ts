import Vuex from 'vuex'
import Vue from 'vue'

Vue.use(Vuex)

import { default as modules } from './modules'

export default new Vuex.Store({
  modules
})