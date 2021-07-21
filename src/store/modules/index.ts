const files = require.context('.', false, /\.(ts|js)$/);
const modules: any = {}

files.keys().forEach(key => {
  if(key.match(/^\.\/index\.(ts|js)$/)) return;
  const data =  (files(key)).default;
  if(!data.state || !data.mutations || !data.getters || !data.actions){
      throw new Error(`${key} missing vuex property`)
  }
  modules[key.replace(/(\.\/|\.(ts|js))/g, '')] = (files(key)).default
});

export default modules;