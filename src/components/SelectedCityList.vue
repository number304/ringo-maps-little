<template>
  <div>
    <v-data-iterator
      :items="cities"
    >
      <template v-slot:header>
        <v-row>
          <v-col
            v-for="header in headers"
            :key="header"
          >
            <p><b>{{ header }}</b></p>
          </v-col>
        </v-row>
      </template>
      <template v-slot:default="props">
        <v-row>
          <v-col
            v-for="(city, index) in props.items"
            :key="index"
            cols="12"
            :style="index % 2 === 0 ? 'background-color: #F2F2F2' : ''"
          >
            <v-row>
              <v-col>
                <p>{{ index + 1 }}</p>
              </v-col>
              <v-col>
                <p>{{ city.name[1].label }}</p>
              </v-col>
              <v-col>
                <p>{{ city.name[0].label }}</p>
              </v-col>
              <v-col>
                <p>{{ city._id }}</p>
              </v-col>
              <v-col>
                <CityMap
                  :city="city"
                  @clickArea="setAreaSelected"
                  @editNeighborhood="toggleModalEditNeighborhood"
                />
              </v-col>
            </v-row>
          </v-col>
        </v-row>
      </template>
    </v-data-iterator>
    <v-dialog style="z-index: 402" v-model="dialog" max-width="800px">
      <EditArea
        :neighborhood="area.neighborhood"
        :city="area.city"
        :letleafEvent="area.letleafEvent"
        @closeModal="toggleModalEditNeighborhood"
      />
    </v-dialog>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { GeoJSON } from 'leaflet';
import CityMap from './CityMap.vue';
import EditArea from './EditArea.vue';
import getCities from '../plugins/http';

export default Vue.extend({
  name: 'components.selectedCityList',
  components: {
    CityMap,
    EditArea,
  },
  data() {
    return {
      headers: ['Index', 'Name', 'Translations', 'Id', 'Map'],
      cities: [],
      dialog: false,
      area: {
        letleafEvent: null,
        neighborhood: null,
        city: null,
      }
    };
  },
  async mounted() {
    this.cities = await getCities();
  },
  methods: {
    toLatLng(array: Array<number>) {
      return GeoJSON.coordsToLatLng([array[0], array[1]]);
    },
    getCities,
    toggleModalEditNeighborhood() {
      this.dialog = !this.dialog
    },
    setAreaSelected(data: any) {
      // console.log(data)
      this.$set(this, "area", {
        letleafEvent: data[0],
        neighborhood: data[1],
        city: data[2],
      })
    }
  },
});
</script>

<style lang="scss" scoped>
</style>
