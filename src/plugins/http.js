import Axios from 'axios';

const url = 'http://localhost:3000/cities';

export default async function getCities() {
  return Axios.get(url)
    .then((res) => res.data);
}
