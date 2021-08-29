import Axios, { AxiosResponse } from 'axios';

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
  },
  post: {
    area: (cityId: string)=>cityId? "/v1.0/areas/":"/v1.0/areas/area"
  },
  put: {
    area: (_id: string)=>'/v1.0/areas/'+_id
  }
}

export const getCities: () => Promise<any> = async () => $api.get(ap.get.cities).then((res) => RINGO_API? res.data.payload :res.data);

// PUT :: Replace city polygon bounderies
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

export const patchCityNames: (cityId: string, newCityNames: any[]) => Promise<AxiosResponse<any>> = async (cityId, newCityNames) => {
  const data = {
    name: newCityNames
  }
  return $api.patch(ap.patch.byId(cityId), data)
}

// POST a new area layer to city (Neighborhood || cutom area in city)
export const addArea: (cityId: string, formData: any) => Promise<AxiosResponse<any>> = async (cityId, formData) => {
  const geometry = formData.mapData[2].geometry;
  const reqPost = {
    id: (formData.mapData[2].id || formData.mapData[2]._id) || undefined,
    name: formData.name,
    areaType: formData.areaType,
    userMade: true,
    color: formData.color,
    FeatureCollection: {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        geometry: {
          ...geometry,
          type: geometry.type == 'Polygon' ? 'MultiPolygon' : geometry.type,
          coordinates: [].concat(geometry.coordinates),
        },
        properties: {
          name: formData.name
        }
      }]
    }
  }

  if(RINGO_API){
    return $api.post(ap.post.area(cityId), reqPost)
  }
  
  return getOldAreas(cityId, '_').then(oldNeighborhoods => {
    const data = {
      areas: [
        reqPost,
        ...oldNeighborhoods
      ]
    }
    // if (areaType) data.areas[0].areaType = areaType
    return $api.patch(ap.patch.byId(cityId), data)
  })
}

export const patchArea: (cityId: string, oldArea: any, formData: any) => Promise<AxiosResponse<any>> = async (cityId, oldArea, formData) => {

  if(RINGO_API) return $api.put(ap.put.area(oldArea._id), {
    name: formData.name, 
    FeatureCollection: {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        geometry: (formData.mapTouched) ? formData.mapData[2].geometry : oldArea.FeatureCollection.features[0].geometry,
        properties: {
          name: formData.name,
        }
      }]
    },
    color: formData.color,
    areaType: formData.areaType,
    userMade: true
  })

  return getOldAreas(cityId, (oldArea.id || oldArea._id)).then(oldNeighborhoods => {
    const data = {
      areas: [
        {
          id: (oldArea.id || oldArea._id),
          name: formData.name,
          areaType: formData.areaType,
          userMade: true,
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