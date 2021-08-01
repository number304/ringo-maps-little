import Axios from 'axios';
import { nanoid } from 'nanoid';

const url = 'http://localhost:3000/cities';

export async function getCities(): Promise<any> {
  return Axios.get(url)
    .then((res) => res.data);
}

export async function patchCityArea(cityId: string, newCityArea: any): Promise<any> {
  console.log(newCityArea)
  return Axios.patch(`${url}/${cityId}`, {
    FeatureCollection: {
      type: 'FeatureCollection',
      features: [
        newCityArea
      ]
    }
  })
}

export async function addArea(cityId: string, formData: any): Promise<any> {
  const oldNeighborhoods = await getOldAreas(cityId, '_')
  console.log(formData)

  return Axios.patch(`${url}/${cityId}`, {
    neighborhoods: [
      {
        id: nanoid(24),
        name: formData.name,
        color: formData.color,
        FeatureCollection: {
          type: 'FeatureCollection',
          features: [{
            type: 'Feature',
            geometry: formData.mapData[2].geometry,
            properties: {
              name: formData.name,
            }
          }]
        }
      },
      ...oldNeighborhoods
    ]
  })
}

// eslint-disable-next-line
export async function patchArea(cityId: string, oldArea: any, formData: any): Promise<any> {
  const oldNeighborhoods = await getOldAreas(cityId, oldArea.id)
  if (formData.mapTouched) {
    return Axios.patch(`${url}/${cityId}`, {
      neighborhoods: [
        {
          id: oldArea.id,
          name: formData.name,
          color: formData.color,
          FeatureCollection: {
            type: 'FeatureCollection',
            features: [{
              type: 'Feature',
              geometry: formData.mapData[2].geometry,
              properties: {
                name: formData.name,
              }
            }]
          }
        },
        ...oldNeighborhoods
      ]
    }).catch(err => console.log(err))
  }
  return Axios.patch(`${url}/${cityId}`, {
    neighborhoods: [
      {
        id: oldArea.id,
        name: formData.name,
        color: formData.color,
        FeatureCollection: {
          type: 'FeatureCollection',
          features: [{
            type: 'Feature',
            geometry: oldArea.FeatureCollection.features[0].geometry,
            properties: {
              name: formData.name,
            }
          }]
        }
      },
      ...oldNeighborhoods
    ]
  }).catch(err => console.log(err))
}

async function getOldAreas(cityId: string, areaId: string): Promise<any> {
  return Axios.get(`${url}/${cityId}`)
    .then(res => res.data)
    .then(data => data.neighborhoods)
    .then(neighborhoods =>
      neighborhoods.filter((nb: any) => nb.id !== areaId)
    )
}
