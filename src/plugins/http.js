import Axios from 'axios';

const url = 'http://localhost:3000/cities';

// eslint-disable-next-line
export default async function getCities() {
  return Axios.get(url)
    .then((res) => res.data);
}

export async function patchArea(cityId, oldArea, formData) {
  const oldNeighborhoods = await getOldAreas(cityId, oldArea._id)
  if (formData.mapTouched) {
    return Axios.patch(`${url}?_id=${cityId}`, {
      neighborhoods: [
        {
          _id: oldArea._id,
          name: formData.name,
          FeatureCollection: {
            type: 'FeatureCollection',
            features: [{
              type: 'Feature',
              properties: {
                name: formData.name,
                color: formData.color
              },
              geometry: {
                type: 'MultiPolygon',
                coordinates: formData.mapData[2].geometry.coordinates
              }
            }]
          }
        },
        ...oldNeighborhoods
      ]
    })
  }
  return Axios.patch(`${url}?_id=${cityId}`, {
    neighborhoods: [
      {
        _id: oldArea._id,
        name: formData.name,
        FeatureCollection: {
          type: 'FeatureCollection',
          features: [{
            type: 'Feature',
            properties: {
              name: formData.name,
              color: formData.color
            },
            geometry: {
              type: 'MultiPolygon',
              coordinates: oldArea.FeatureCollection
                .features[0].geometry.coordinates
            }
          }]
        }
      },
      ...oldNeighborhoods
    ]
  })
}

async function getOldAreas(cityId, areaId) {
  return Axios.get(`${url}?_id=${cityId}`)
    .then(res => res.data)
    .then(data => data[0].neighborhoods)
    .then(neighborhoods =>
      neighborhoods.filter((nb) => nb._id !== areaId)
    ).then(res => console.log(res))
}

export async function getArea(cityId, areaId) {
  return Axios.get(`${url}?_id=${cityId}`)
    .then(res => res.data)
    .then(data => data[0].neighborhoods)
    .then(nb => nb.filter((x) => x._id === areaId))
    .then(arr => arr[0])
}
