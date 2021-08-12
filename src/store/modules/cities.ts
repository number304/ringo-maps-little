import * as http from '@/plugins/http'
import { default as State } from '../types'

const state: State = {
  cities: {
    items: [],
    selected: []
  },
  area: {
    neighborhood: null,
    city: null,
    letleafEvent: null,
  },
  collidingNBs: []
}

const getters = {
  allCities: (state: State): any[] => state.cities.items,
  selectedCities: (state: State): any[] => state.cities.selected,
  getArea: (state: State): any => state.area,
  getCollidingNBs: (state: State): any[] => state.collidingNBs
}

const actions = {
  "cities/selected": function(context: any, payload: {item: any, action: "add"|"remove"}){
    context.commit('cities/selected/'+payload.action, payload.item);
  },
  async fetchCities(context: any): Promise<any> {
    return http.getCities().then(res=>context.commit('setCities', res)).catch(e=>{
      throw e;
    })
  },
  setArea(context: any, data: []): void {
    context.commit('setArea', data)
  },
  async createArea(context: any, data: any[]): Promise<any> {
    return  http.addArea(data[0], data[1]).then(()=>context.dispatch('fetchCities'))
  },
  async deleteNeighborhoods(context: any, data: any[]): Promise<any> {
    await http.deleteAreas(data[0], data[1])
    context.dispatch('fetchCities')
  },
  async editArea(context: any, data: any[]): Promise<any> {
    return http.patchArea(data[0], data[1], data[2]).then(()=>context.dispatch('fetchCities'))
  },
  cleanCollidingNBs(context: any): void {
    context.commit('cleanCollidingNBs')
  },
  cleanNeighborhood(context: any): void {
    context.commit('cleanNeighborhood')
  },
  pushCollidingNb(context: any, collidingNb: any): void {
    context.commit('setCollidingNBs', collidingNb)
  },
  async setCityArea(context: any, data: any[]): Promise<any> {
    return http.patchCityArea(data[0], data[1]).then(()=>context.dispatch('fetchCities'))
  },
  setNeighborhood(context: any, neighborhood: any): void {
    context.commit('setNeighborhood', neighborhood)
  }
}

const mutations = {
  cleanCollidingNBs: (state: State) => state.collidingNBs = [],
  cleanNeighborhood: (state: State) => state.area.neighborhood = null,
  setCities: (state: State, cities: any[]): any[] => state.cities.items = cities,
  setArea: (state: State, data: any[]) => {
    state.area.letleafEvent = data[0];
    state.area.neighborhood = data[1];
    state.area.city = data[2];
  },
  setCollidingNBs: (state: State, collidingNb: any) => {
    state.collidingNBs.push(collidingNb)
  },
  setNeighborhood: (state: State, neighborhood: any) => {
    state.area.neighborhood = neighborhood
  },
  "cities/selected/add": (state: State, item: any)=>{
    console.log(item)
    if(!item || !item.id || state.cities.selected.find(x=>x.id==item.id)) return;
    state.cities.selected.push(item);
  },
  "cities/selected/remove": (state: State, item: any)=>{
    const index = state.cities.selected.findIndex(x=>x.id==item.id);
    if(index == -1) return;
    state.cities.selected.splice(index, 1);
  },
  "cities/selected/replace": (state: State, items: any[])=>{
    state.cities.selected = items;
  },

}

export default {
  state,
  mutations,
  getters,
  actions
}