import Axios from 'axios';

const url = 'http://localhost:3000/cities';

// eslint-disable-next-line
export default async function getCities() {
  return Axios.get(url)
    .then((res) => res.data);
}

// export async function patchArea(id, ) {
//   return Axios.patch(`${url}/${id}`, {

//   })
// }