import Axios, { AxiosResponse } from 'axios';
import { nanoid } from 'nanoid';

export const $api = Axios.create({
  baseURL: "/api",
  headers: {
    'Content-Type': 'application/json',
    Authorization: process.env.VUE_APP_API_TOKEN
  }
});

const RINGO_API = process.env.VUE_APP_RINGO_API.toLowerCase() === 'true';

const ap = {
  get: {
    cities: RINGO_API ? "/v1.0/areas/cities?all=true&FeatureCollection=true" : "/cities",
    byId: (cityId: string)=>RINGO_API ? "/v1.0/areas/city/"+cityId+"/?FeatureCollection" : '/cities/'+cityId
  },
  patch: {
    byId: (cityId: string)=>RINGO_API ? "/v1.0/areas/city/"+cityId : '/cities/' + cityId,
  }
}

console.log(ap);

export const getCities: () => Promise<any> = async () => $api.get(ap.get.cities).then((res) => RINGO_API? res.data.payload :res.data);

// PUT :: Replace city pologon bounderies
export const patchCityArea: (cityId: string, newCityArea: any) => Promise<AxiosResponse<any>> = async (cityId, newCityArea) => {
  const data = {
    FeatureCollection: {
      type: 'FeatureCollection',
      features: [
        newCityArea
      ]
    }
  }
  return $api.patch(ap.patch.byId(cityId), data);
}

// POST a new area layer to city (Neighborhood || cutom area in city)
export const addArea: (cityId: string, formData: any, custom: any) => Promise<AxiosResponse<any>> = async (cityId, formData, custom) => {
  return getOldAreas(cityId, '_').then(oldNeighborhoods => {
    const data = {
      areas: [
        {
          id: nanoid(24),
          name: formData.name,
          userMade: true,
          color: formData.color,
          FeatureCollection: {
            type: 'FeatureCollection',
            features: [{
              type: 'Feature',
              geometry: {
                ...formData.mapData[2].geometry,
                type: formData.mapData[2].geometry.type == 'Polygon' ? 'MultiPolygon' : formData.mapData[2].geometry.type,
                coordinates: formData.mapData[2].geometry.type == 'Polygon' ? [formData.mapData[2].geometry.coordinates] : formData.mapData[2].geometry.coordinates,
              },
              properties: {
                name: formData.name
              }
            }]
          }
        },
        ...oldNeighborhoods
      ]
    }
    if (custom) data.areas[0].areaType = 'custom'
    return $api.patch(ap.patch.byId(cityId), data)
  })
}

export const patchArea: (cityId: string, oldArea: any, formData: any) => Promise<AxiosResponse<any>> = async (cityId, oldArea, formData) => {

  return getOldAreas(cityId, (oldArea.id || oldArea._id)).then(oldNeighborhoods => {
    const data = {
      areas: [
        {
          id: (oldArea.id || oldArea._id),
          name: formData.name,
          'userMade': true,
          color: formData.color,
          FeatureCollection: {
            type: 'FeatureCollection',
            features: [{
              type: 'Feature',
              geometry: (formData.mapTouched) ? formData.mapData[2].geometry : oldArea.FeatureCollection.features[0].geometry,
              properties: {
                name: formData.name,
              }
            }]
          }
        },
        ...oldNeighborhoods
      ]
    }
    return $api.patch(ap.patch.byId(cityId), data);
  })

}

export const deleteAreas: (cityId: string, ids: string[])=>Promise<AxiosResponse<any>> = async (cityId, ids) =>{
  return $api.get(ap.get.byId(cityId))
      .then(res=>res.data.areas.filter((nb: any)=>ids.indexOf((nb._id || nb.id))==-1))
      .then(areas=>$api.patch(ap.patch.byId(cityId), {areas}))
}

export const getOldAreas: (cityId: string, areaId: string)=>Promise<any[]> = async (cityId, areaId)=>{
  return $api.get(ap.get.byId(cityId)).then(res=>res.data.areas.filter((nb: any) => (nb._id || nb.id) !== areaId))
}

export const cityById: (cityId: string)=>Promise<any> = async (cityId)=>{
  return $api.get(ap.get.byId(cityId)).then(res=>RINGO_API?res.data.payload[0]:res.data);
}