import Axios from 'axios';

const url = 'http://localhost:3000/cities';

// eslint-disable-next-line
export default async function getCities() {
  return Axios.get(url)
    .then((res) => res.data);
}

// export async function patchArea(cityId, areaId, data) {
//   return Axios.patch(`${url}?_id=${cityId}`, {

//   })
// }

export async function getArea(cityId, areaId) {
  return Axios.get(`${url}?_id=${cityId}`)
    .then(res => res.data)
    .then(data => data[0].neighborhoods)
    .then(nb => nb.filter((x) => x._id === areaId))
    .then(arr => arr[0])
}
