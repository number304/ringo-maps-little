import Axios, { AxiosResponse } from 'axios';
import { nanoid } from 'nanoid';

const $http = Axios.create({
  baseURL: process.env.VUE_APP_API_URL ||  "http://localhost:3000"
});

export const getCities: () => Promise<any> = async () => $http.get("/cities").then((res) => res.data);

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
  return $http.patch('/cities/' + cityId, data);
}

// POST a new area layer to city (Neighborhood || cutom area in city)
export const addArea: (cityId: string, formData: any) => Promise<AxiosResponse<any>> = async (cityId, formData) => {
  return getOldAreas(cityId, '_').then(oldNeighborhoods => {
    const data = {
      neighborhoods: [
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
    return $http.patch('/cities/' + cityId, data)
  })
}

export const patchArea: (cityId: string, oldArea: any, formData: any) => Promise<AxiosResponse<any>> = async (cityId, oldArea, formData) => {

  return getOldAreas(cityId, oldArea.id).then(oldNeighborhoods => {
    const data = {
      neighborhoods: [
        {
          id: oldArea.id,
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
    return $http.patch('/cities/' + cityId, data);
  })

}

export const deleteAreas: (cityId: string, ids: string[])=>Promise<AxiosResponse<any>> = async (cityId, ids) =>{
  return $http.get('/cities/'+cityId)
      .then(res=>res.data.neighborhoods.filter((nb: any)=>ids.indexOf(nb.id)==-1))
      .then(neighborhoods=>$http.patch('/cities/'+cityId, {neighborhoods}))
}

export const getOldAreas: (cityId: string, areaId: string)=>Promise<any[]> = async (cityId, areaId)=>{
  return $http.get('/cities/'+cityId).then(res=>res.data.neighborhoods.filter((nb: any) => nb.id !== areaId))
}