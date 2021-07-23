import getCities from '@/plugins/http'
import { default as State } from '../types'

const state: State = {
  cities: [],
  area: {
    neighborhood: null,
    city: null,
    letleafEvent: null,
  },
  form: {
    name: [{ language: '', label: null }],
    color: { active: null, hover: null, status: null },
    mapTouched: false,
    mapData: null
  },
}

const getters = {
  allCities: (state: State): any[] => state.cities,
  getArea: (state: State): any => state.area,
  getForm: (state: State): any => state.form,
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
  initForm(context: any, area: any): void {
    context.commit('initForm', area)
  }
  // updateForm(context: any, area: any): void {
  //   context.commit('setForm', area)
  // }
}

const mutations = {
  setCities: (state: State, cities: any[]): any[] => state.cities = cities,
  setArea: (state: State, data: any[]) => {
    state.area.letleafEvent = data[0];
    state.area.neighborhood = data[1];
    state.area.city = data[2];
  },
  initForm: (state: State, area: any) => {
    state.form.name = area.name
    if (area.color) state.form.color = area.color
    else state.form.color = { active: '#e3a702', hover: '#571414', status: '#55915c' }
  }
}

export default {
  state,
  mutations,
  getters,
  actions
}