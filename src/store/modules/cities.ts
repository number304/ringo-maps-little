import { multiPolygan2itm } from '@/helpers/itm';
import * as http from '@/plugins/http'
import { default as State } from '../types';
const RINGO_API = process.env.VUE_APP_RINGO_API.toLowerCase() === 'true';
import {app} from '@/main'

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
  "cities/selected": function(context: any, payload: {item: any, action: "add"|"remove"|"replace"}){
   // load single neighborhood by add action
    if(RINGO_API && payload.action == "add" && typeof payload.item == "object" && (payload.item.id || payload.item._id) && !payload.item.areas && !Array.isArray(payload.item.areas)){
      return http.cityById(payload.item._id).then(city=>{
        context.dispatch('cities/setCityNeighborhoods', {city: payload.item, areas: city.areas})
        context.commit('cities/selected/'+payload.action, payload.item);
      }).catch(e=>console.log(e))
    }
    // ensure all areas are loaded via api on selected cities
    if(RINGO_API && payload.action == "replace"){
      return Promise.all(payload.item.map((item: any)=>new Promise((res, rej)=>{
          const city = state.cities.items.find((x: any)=>x._id==item._id);
          if(!city) return rej(new Error('No city found with such id!'));
          if(city && city.areas && Array.isArray(city.areas)) return res(city);
        return http.cityById(item._id).then(cityData=>{
            context.dispatch("cities/setCityNeighborhoods", {city, areas: cityData.areas});
            res(city);
        }).catch(e=>rej(e))
      }))).then(cities=>{
        context.commit("cities/selected/replace", cities)
      })
  }

    context.commit('cities/selected/'+payload.action, payload.item);
  },
  "cities/setCityNeighborhoods": function(context: any, payload: {city: any, areas: any[]}){

    if(payload.areas && Array.isArray(payload.areas))
    for(let i=0; i < payload.areas.length; i++){
      try {
        payload.areas[i].itm = {
          data: multiPolygan2itm(payload.areas[i].FeatureCollection.features[0].geometry.coordinates[0][0]),
          Wkt: multiPolygan2itm(payload.areas[i].FeatureCollection.features[0].geometry.coordinates[0][0], "string")
        }
      } catch (error) {
        payload.areas[i].itm = {
          data: [],
          Wkt: ''
        }
      }
    }

    context.commit("cities/set/areas", payload);
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
    const [cityId, form] = data;
    return  http.addArea(cityId, form).then(()=>{
      const findCityIndex = state.cities.items.findIndex(x=>(x.id||x._id)==cityId);
      if(findCityIndex == -1) return;
      // @TODO insert the new gemotry
      // state.cities.items[findCityIndex];
      // app.$forceUpdate();
    })
    //.then(()=>context.dispatch('fetchCities'))
  },
  async deleteNeighborhoods(context: any, data: any[]): Promise<any> {
    await http.deleteAreas(data[0], data[1])
    context.dispatch('fetchCities')
  },
  async editArea(context: any, data: any[]): Promise<any> {
    return http.patchArea(data[0], data[1], data[2])
    //.then(()=>context.dispatch('fetchCities'))
  },
  cleanCollidingNBs(context: any): void {
    context.commit('cleanCollidingNBs')
  },
  cleanNeighborhood(context: any): void {
    context.commit('cleanNeighborhood')
  },
  async editCityName(context: any, data: any[]): Promise<any> {
    await http.patchCityNames(data[0], data[1])
    context.commit('changeCityName', data)
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
  changeCityName: (state: State, data: any[]) => {
    const [cityId, newCityNames] = data
    const cityFunction = (city: any, cityId: any) => {
      if (city.id !== cityId) return city;
      city.name = newCityNames
      return city
    }

    state.cities.selected = state.cities.selected.map((city: any) => cityFunction(city, cityId));
    state.cities.items = state.cities.items.map((city: any) => cityFunction(city, cityId));
  },
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
    if(!item || !(item._id || item.id) || state.cities.selected.find(x=>(x.id || x._id)==(item._id || item.id))){
      console.log(item, new Error('item not found'))
      return;
    }
    state.cities.selected.push(item);
  },
  "cities/selected/remove": (state: State, item: any)=>{
    const index = state.cities.selected.findIndex(x=>(x.id || x._id)==(item.id || item._id));
    if(index == -1) return;
    state.cities.selected.splice(index, 1);
  },
  "cities/selected/replace": (state: State, items: any[])=>{
    state.cities.selected = items;
  },
  "cities/set/byId": (state: State, city: any)=>{
    const index = state.cities.items.findIndex(x=>RINGO_API?x._id==city._id:x.id==city.id);
    if(index != -1) state.cities.items[index] = city;
  },
  "cities/set/areas": (state: State, payload: {city: any, areas: any[]})=>{
    const index = state.cities.items.findIndex(x=>(x._id || x.id) == (payload.city.id || payload.city._id));
    if(index > -1) state.cities.items[index].areas = payload.areas;
  }

}

export default {
  state,
  mutations,
  getters,
  actions
}