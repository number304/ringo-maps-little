import axios from 'axios'
const url = 'http://localhost:3000/cities'

interface State {
  cities: any[]
}

const state: State = {
  cities: []
}

const getters = {
  allCities: (state: State) => state.cities
}

const actions = {
  async fetchCities(context: any) {
    const response = await axios.get(url)
    console.log(response.data)

    context.commit('setCities', response.data)
  }
}

const mutations = {
  setCities: (state: State, cities: any[]) => state.cities = cities
}

export default {
  state,
  mutations,
  getters,
  actions
}