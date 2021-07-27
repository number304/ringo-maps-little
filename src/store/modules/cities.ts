import { addArea, default as getCities, patchArea } from '@/plugins/http'
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
  // getCity: (state: State): any => (cityId: String) =>
  //   state.cities.find(city => city.id === cityId),
}

const actions = {
  async fetchCities(context: any): Promise<any> { //eslint-disable-line
    const response = await getCities()
    // console.log(response)

    context.commit('setCities', response)
  },
  setArea(context: any, data: []): void {
    context.commit('setArea', data)
  },
  //eslint-disable-next-line
  async createArea(context: any, data: any[]): Promise<any> {
    await addArea(data[0], data[1])
    context.dispatch('fetchCities')
  },
  //eslint-disable-next-line
  async editArea(context: any, data: any[]): Promise<any> {
    await patchArea(data[0], data[1], data[2])
    context.dispatch('fetchCities')
  },
  cleanArea(context: any): void {
    context.commit('cleanArea')
  }
}

const mutations = {
  setCities: (state: State, cities: any[]): any[] => state.cities = cities,
  setArea: (state: State, data: any[]) => {
    state.area.letleafEvent = data[0];
    state.area.neighborhood = data[1];
    state.area.city = data[2];
  },
  cleanArea: (state: State) => state.area.neighborhood = null,
}

export default {
  state,
  mutations,
  getters,
  actions
}