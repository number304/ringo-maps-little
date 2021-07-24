import Axios from 'axios';

const url = 'http://localhost:3000/cities';

export default async function getCities(): Promise<any> {
  return Axios.get(url)
    .then((res) => res.data);
}

// eslint-disable-next-line
export async function patchArea(cityId: string, oldArea: any, formData: any): Promise<any> {
  const oldNeighborhoods = await getOldAreas(cityId, oldArea.id)
  console.log(oldNeighborhoods)
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

// export async function getArea(cityId: string, areaId: string): Promise<any> {
//   return Axios.get(`${url}/${cityId}`)
//     .then(res => res.data)
//     .then(data => data.neighborhoods)
//     .then(nb => nb.filter((x: any) => x.id === areaId))
//     .then(arr => arr[0])
// }
