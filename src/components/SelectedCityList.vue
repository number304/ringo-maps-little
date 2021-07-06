<template>
  <div>
    <v-data-iterator
      :items="cities"
    >
      <template v-slot:header>
        <v-row>
          <v-col
            v-for="item in headers"
            :key="item.text"
          >
            <p><b>{{ item.text }}</b></p>
          </v-col>
        </v-row>
      </template>
      <template v-slot:default="props">
        <v-row>
          <v-col
            v-for="(item, index) in props.items"
            :key="index"
            cols="12"
            :style="index % 2 === 0 ? 'background-color: #F2F2F2' : ''"
          >
            <v-row>
              <v-col>
                <p>{{ index + 1 }}</p>
              </v-col>
              <v-col>
                <p>{{ item.name }}</p>
              </v-col>
              <v-col>
                <p>{{ item.translations }}</p>
              </v-col>
              <v-col>
                <p>{{ item.id }}</p>
              </v-col>
              <v-col>
                <CityMap :coordinates="toLatLng(item.coordinates)" />
              </v-col>
            </v-row>
          </v-col>
        </v-row>
      </template>
    </v-data-iterator>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { latLng } from 'leaflet';
import CityMap from './CityMap.vue';

export default Vue.extend({
  name: 'components.selectedCityList',
  components: {
    CityMap,
  },
  data() {
    return {
      headers: [
        {
          text: 'Index',
          align: 'start',
          value: 'index',
        },
        { text: 'Name', value: 'name' },
        { text: 'Translations', value: 'translations' },
        { text: 'Id', value: 'id' },
        { text: 'Map', value: 'coordinates' },
      ],
      cities: [
        {
          name: 'Jerusalem',
          translations: 'ירושלים , القدس',
          id: '5f197ba2a69db72eb094bc0a',
          // coordinates: [35.211391, 31.775654],
          coordinates: [31.775654, 35.211391],
        },
        {
          name: 'Kfar Adumim',
          translations: 'כפר אדומים , כפר אדומים',
          id: '5f197bd5a69db72eb094bc2c',
          // coordinates: [35.332791, 31.823963],
          coordinates: [31.823963, 35.332791],
        },
        {
          name: 'Maale Adomim',
          translations: 'מעלה אדומים , معاليه أدوميم',
          id: '5f197ceda69db72eb094bce7',
          // coordinates: [35.311355, 31.785264],
          coordinates: [31.785264, 35.311355],
        },
      ],
    };
  },
  methods: {
    toLatLng(array: Array<number>) {
      return latLng(array[0], array[1]);
    },
  },
});
</script>

<style lang="scss" scoped>
.myAreaMap {
  width: 100%;
  height: 400px;
}
</style>
