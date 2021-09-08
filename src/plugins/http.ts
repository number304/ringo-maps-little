import Axios, { AxiosResponse } from 'axios';

export const $api = Axios.create({
  baseURL: "/api",
  headers: {
    'Content-Type': 'application/json',
    Authorization: process.env.VUE_APP_API_TOKEN
  }
});

const ap = {
  get: {
    cities: "/v1.0/areas/cities?all=true&FeatureCollection=true",
    byId: (cityId: string)=> "/v1.0/areas/city/"+cityId+"/?FeatureCollection"
  },
  patch: {
    byId: (cityId: string)=> "/v1.0/areas/city/"+cityId,
  },
  post: {
    area: (cityId: string)=> cityId ? "/v1.0/areas/" : "/v1.0/areas/area"
  },
  put: {
    area: (_id: string)=> '/v1.0/areas/'+_id
  }
}

export const getCities: () => Promise<any> = async () => $api.get(ap.get.cities).then((res) => res.data.payload);

// PATCH: Replace city polygon bounderies
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

  return $api.post(ap.post.area(cityId), reqPost)
}

// PUT: editing an existing area
export const putArea: (oldArea: any, formData: any) => Promise<AxiosResponse<any>> = async (oldArea, formData) => {
  return $api.put(ap.put.area(oldArea._id), {
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
}

// DELETE: delete an array of areas by _id (in progress)
export const deleteAreas: (cityId: string, ids: string[])=>Promise<AxiosResponse<any>> = async (cityId, ids) =>{
  return $api.get(ap.get.byId(cityId))
      .then(res=>res.data.payload[0].areas.filter((nb: any)=>ids.indexOf(nb._id)==-1))
      .then(areas=>$api.patch(ap.patch.byId(cityId), {areas}))
}

// GET: get one city by _id
export const cityById: (cityId: string)=>Promise<any> = async (cityId)=>{
  return $api.get(ap.get.byId(cityId)).then(res=>res.data.payload[0]);
}
