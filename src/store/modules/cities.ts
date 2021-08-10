import * as http from '@/plugins/http'
import { default as State } from '../types'

const state: State = {
  cities: [],
  area: {
    neighborhood: null,
    city: null,
    letleafEvent: null,
  },
  collidingNBs: []
}

const getters = {
  allCities: (state: State): any[] => state.cities,
  getArea: (state: State): any => state.area,
  getCollidingNBs: (state: State): any[] => state.collidingNBs,
  // getCity: (state: State): any => (cityId: String) =>
  //   state.cities.find(city => city.id === cityId),
}

const actions = {
  async fetchCities(context: any): Promise<any> { //eslint-disable-line
    const response = await http.getCities()
    // console.log(response)

    context.commit('setCities', response)
  },
  setArea(context: any, data: []): void {
    context.commit('setArea', data)
  },
  //eslint-disable-next-line
  async createArea(context: any, data: any[]): Promise<any> {
    await http.addArea(data[0], data[1])
    context.dispatch('fetchCities')
  },
  async deleteNeighborhoods(context: any, data: any[]): Promise<any> {
    await http.deleteAreas(data[0], data[1])
    context.dispatch('fetchCities')
  },
  //eslint-disable-next-line
  async editArea(context: any, data: any[]): Promise<any> {
    await http.patchArea(data[0], data[1], data[2])
    context.dispatch('fetchCities')
  },
  cleanNeighborhood(context: any): void {
    context.commit('cleanNeighborhood')
  },
  pushCollidingNBs(context: any, collidingNBsArray: any[]): void {
    context.commit('setCollidingNBs', collidingNBsArray)
  },
  async setCityArea(context: any, data: any[]): Promise<any> {
    console.log(data[1])
    await http.patchCityArea(data[0], data[1])
    context.dispatch('fetchCities')
  },
  setNeighborhood(context: any, neighborhood: any): void {
    context.commit('setNeighborhood', neighborhood)
  }
}

const mutations = {
  cleanNeighborhood: (state: State) => state.area.neighborhood = null,
  setCities: (state: State, cities: any[]): any[] => state.cities = cities,
  setArea: (state: State, data: any[]) => {
    state.area.letleafEvent = data[0];
    state.area.neighborhood = data[1];
    state.area.city = data[2];
  },
  setCollidingNBs: (state: State, collidingNBsArray: any[]) => {
    state.collidingNBs.push(...collidingNBsArray)
  },
  setNeighborhood: (state: State, neighborhood: any) => {
    state.area.neighborhood = neighborhood
  },
}

export default {
  state,
  mutations,
  getters,
  actions
}