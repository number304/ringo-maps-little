import Axios from 'axios';

const url = 'http://localhost:3000/cities';

// eslint-disable-next-line
export default async function getCities() {
  return Axios.get(url)
    .then((res) => res.data);
}

export async function patchArea(cityId, oldArea, formData) {
  const oldNeighborhoods = await getOldAreas(cityId, oldArea.id)
  console.log(oldNeighborhoods)
  if (formData.mapTouched) {
    return Axios.patch(`${url}/${cityId}`, {
      neighborhoods: [
        {
          id: oldArea.id,
          name: formData.name,
          FeatureCollection: {
            type: 'FeatureCollection',
            features: [{
              type: 'Feature',
              geometry: formData.mapData[2].geometry,
              properties: {
                name: formData.name,
                color: formData.color
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
        FeatureCollection: {
          type: 'FeatureCollection',
          features: [{
            type: 'Feature',
            geometry: oldArea.FeatureCollection.features[0].geometry,
            properties: {
              name: formData.name,
              color: formData.color
            }
          }]
        }
      },
      ...oldNeighborhoods
    ]
  }).catch(err => console.log(err))
}

async function getOldAreas(cityId, areaId) {
  return Axios.get(`${url}/${cityId}`)
    .then(res => res.data)
    .then(data => data.neighborhoods)
    .then(neighborhoods =>
      neighborhoods.filter((nb) => nb.id !== areaId)
    )
}

export async function getArea(cityId, areaId) {
  return Axios.get(`${url}/${cityId}`)
    .then(res => res.data)
    .then(data => data.neighborhoods)
    .then(nb => nb.filter((x) => x.id === areaId))
    .then(arr => arr[0])
}
