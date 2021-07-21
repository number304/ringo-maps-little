import axios from 'axios'
const url = 'http://localhost:3000/cities'

interface State {
  cities: object[]
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

    context.commit('setCities', response.data)
  }
}

const mutations = {
  setCities: (state: State, cities: object[]) => state.cities = cities
}

export default {
  state,
  mutations,
  getters,
  actions
}