import { multiPolygan2itm } from '@/helpers/itm';
import * as http from '@/plugins/http'
// import { default as State } from '../types';
const RINGO_API = process.env.VUE_APP_RINGO_API.toLowerCase() === 'true';
import { nanoid } from 'nanoid';
import {app} from '@/main'

const state = {
  cities: {
    items: [] as any[],
    selected: [] as any[]
  },
  area: {
    neighborhood: null,
    city: null,
    letleafEvent: null,
    types: ['neighborhood','cityArea']
  },
  collidingNBs: [] as any[]
}

export type State = typeof state;

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

    if (!RINGO_API) form.mapData[2].id = nanoid(24);

    return  http.addArea(cityId, form).then(()=>{
      const findCityIndex = state.cities.items.findIndex(x=>(x.id||x._id)==cityId);
      if(findCityIndex == -1) return;
      const selectedCityIndex = state.cities.selected.findIndex(city => (city.id || city._id) == cityId)
      const newArea = {
        id: (form.mapData[2].id || form.mapData[2]._id),
        name: form.name,
        areaType: form.areaType,
        userMade: true,
        color: form.color,
        FeatureCollection: {
          type: 'FeatureCollection',
          features: [{
            type: 'Feature',
            geometry: {
              ...form.mapData[2].geometry,
              type: form.mapData[2].geometry.type == 'Polygon' ? 'MultiPolygon' : form.mapData[2].geometry.type,
              coordinates: form.mapData[2].geometry.type == 'Polygon' ? [form.mapData[2].geometry.coordinates] : form.mapData[2].geometry.coordinates,
            },
            properties: {
              name: form.name
            }
          }]
        }
      }
      const areas = [
        newArea,
        ...state.cities.selected[selectedCityIndex].areas
      ]
      context.commit('editCityAreas', [selectedCityIndex, areas])
    })
  },
  async deleteNeighborhoods(context: any, data: any[]): Promise<any> {
    await http.deleteAreas(data[0], data[1]).then(() => {
      const [cityId, ids] = data
      const findCityIndex = state.cities.items.findIndex(x=>(x.id||x._id)==cityId);
      const selectedCityIndex = state.cities.selected.findIndex(city => (city.id || city._id) == cityId)

      if(findCityIndex == -1) return;
      const areas = state.cities.selected[selectedCityIndex].areas
        .filter((area: any) => ids.indexOf((area.id || area._id)) === -1)
      context.commit('editCityAreas', [selectedCityIndex, areas])
    })
  },
  async editArea(context: any, data: [cityId: string, oldArea: any, formData: any]): Promise<any> {
    const [cityId, oldArea, form] = data

    return http.patchArea(cityId, oldArea, form)
    .then(()=>{
      const findCityIndex = state.cities.items.findIndex(x=>(x.id||x._id)==cityId);

      if(findCityIndex == -1) return;
      const selectedCityIndex = state.cities.selected.findIndex(city => (city.id || city._id) == cityId)

      const oldAreas = state.cities.selected[selectedCityIndex].areas
      .filter((area: any) =>
        (area.id || area._id) !== (oldArea.id || oldArea._id))

      let geometry = oldArea.FeatureCollection.features[0].geometry
      if (form.mapData) geometry = {
        ...form.mapData[2].geometry,
        type: form.mapData[2].geometry.type == 'Polygon' ? 'MultiPolygon' : form.mapData[2].geometry.type,
        coordinates: form.mapData[2].geometry.type == 'Polygon' ? [form.mapData[2].geometry.coordinates] : form.mapData[2].geometry.coordinates,
      }
      const newArea = {
        id: (oldArea.id || oldArea._id),
        name: form.name,
        areaType: form.areaType,
        userMade: true,
        color: form.color,
        FeatureCollection: {
          type: 'FeatureCollection',
          features: [{
            type: 'Feature',
            geometry,
            properties: {
              name: form.name
            }
          }]
        }
      }

      const areas = [newArea, ...oldAreas]
      context.commit('editCityAreas', [selectedCityIndex, areas])
      context.commit('setNeighborhood', newArea)
    })
  },
  cleanCollidingNBs(context: any): void {
    context.commit('cleanCollidingNBs')
  },
  cleanNeighborhood(context: any): void {
    context.commit('cleanNeighborhood')
  },
  async editCityName(context: any, data: [cityId: string, newCityNames: any[]]): Promise<any> {
    const [cityId, newCityNames] = data;
    await http.patchCityNames(cityId, newCityNames);
    context.commit('changeCityName', data);
  },
  pushCollidingNb(context: any, collidingNb: any): void {
    context.commit('setCollidingNBs', collidingNb)
  },
  async setCityArea(context: any, data: [cityId: string, newCityArea: any, cityIndex: number]): Promise<any> {
    const [cityId, newCityArea, cityIndex] = data;
    context.commit('editCityLayer', [newCityArea, cityIndex])
    return http.patchCityArea(cityId, newCityArea)
  },
  setNeighborhood(context: any, neighborhood: any): void {
    context.commit('setNeighborhood', neighborhood)
  }
}

const mutations = {
  changeCityName: (state: State, data: [cityId: string, newCityNames: any[]]) => {
    const [cityId, newCityNames] = data
    const cityFunction = (city: any, cityId: any) => {
      if ((city.id || city._id) !== cityId) return city;
      city.name = newCityNames
      return city
    }

    state.cities.selected = state.cities.selected.map((city: any) => cityFunction(city, cityId));
    state.cities.items = state.cities.items.map((city: any) => cityFunction(city, cityId));
  },
  cleanCollidingNBs: (state: State) => state.collidingNBs = [],
  cleanNeighborhood: (state: State) => state.area.neighborhood = null,
  editCityAreas: (state: State, data: any[]) => state.cities.selected[data[0]].areas = data[1],
  editCityLayer: (state: State, data: [newCityArea: any, cityIndex: number]) =>
    state.cities.selected[data[1]].FeatureCollection.features[0] = data[0],
  setCities: (state: State, cities: any[]): any[] => state.cities.items = cities,
  setArea: (state: State, data: [letleafEvent: any, neighborhood: any, city: any]) => {
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
