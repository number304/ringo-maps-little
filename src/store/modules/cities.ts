import getCities from '@/plugins/http'
import { default as State } from '../types'

const state: State = {
  cities: [],
  area: {
    neighborhood: null,
    city: null,
    letleafEvent: null,
  },
}

const getters = {
  allCities: (state: State): any[] => state.cities,
  getArea: (state: State): any => state.area,
}

const actions = {
  async fetchCities(context: any): Promise<any> { //eslint-disable-line
    const response = await getCities()
    console.log(response)

    context.commit('setCities', response)
  },
  setArea(context: any, data: []): void {
    context.commit('setArea', data)
  },
}

const mutations = {
  setCities: (state: State, cities: any[]): any[] => state.cities = cities,
  setArea: (state: State, data: any[]) => {
    state.area.letleafEvent = data[0];
    state.area.neighborhood = data[1];
    state.area.city = data[2];
  },
}

export default {
  state,
  mutations,
  getters,
  actions
}