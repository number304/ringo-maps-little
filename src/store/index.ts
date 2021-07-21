import Vuex from 'vuex'
import Vue from 'vue'
// import cities from './modules/cities'

Vue.use(Vuex)

import { default as modules } from './modules'

export default new Vuex.Store({
  modules
})