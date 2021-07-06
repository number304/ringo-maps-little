<template>
  <div>
    <div ref="cityMap" class="cityMap"></div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default Vue.extend({
  name: 'CityMap',
  props: {
    coordinates: {
      type: L.LatLng,
    },
  },
  data() {
    return {
      map: null as unknown as L.Map,
    };
  },
  mounted() {
    this.initMap();
  },
  methods: {
    initMap() {
      this.map = L.map(this.$refs.cityMap as HTMLElement, undefined)
        .setView(this.coordinates, 13);

      L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a>',
      }).addTo(this.map);
    },
  },
});
</script>

<style lang="scss" scoped>
.cityMap {
  width: 100%;
  height: 200px;
}
</style>
