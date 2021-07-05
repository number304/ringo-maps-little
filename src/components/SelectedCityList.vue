<template>
  <div>
    <!-- <v-data-table
      class="elevation-1"
      :headers="headers"
      :items="cities"
    ></v-data-table> -->
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
                <p>{{ item.coordinates }}</p>
              </v-col>
            </v-row>
          </v-col>
        </v-row>
      </template>
    </v-data-iterator>
    <div ref="myMap"></div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
// import L from 'leaflet';
// import 'leaflet/dist/leaflet.css';

export default Vue.extend({
  name: 'components.selectedCityList',
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
          coordinates: [35.211391, 31.775654],
        },
        {
          name: 'Kfar Adumim',
          translations: 'כפר אדומים , כפר אדומים',
          id: '5f197bd5a69db72eb094bc2c',
          coordinates: [35.332791, 31.823963],
        },
        {
          name: 'Maale Adomim',
          translations: 'מעלה אדומים , معاليه أدوميم',
          id: '5f197ceda69db72eb094bce7',
          coordinates: [35.311355, 31.785264],
        },
      ],
      // map: null as unknown as L.Map,
    };
  },
  // methods: {
  //   initMap() {
  //     this.map = L.map(this.$refs.myMap as HTMLElement, undefined)
  //       .setView([35.332791, 31.823963], 13);
  //   },
  // },
});
</script>
