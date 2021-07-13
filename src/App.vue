<template>
  <v-app id="app">
    <SelectedCityList />
  </v-app>
</template>

<script lang="ts">
import Vue from 'vue';
import SelectedCityList from './components/SelectedCityList.vue';

export default Vue.extend({
  name: 'App',
  components: {
    SelectedCityList,
  },
});
</script>

<style lang="scss">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 20px;
}
</style>
