<template>
  <div>
    <div ref="cityMap" class="cityMap"></div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';

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

      // L.control.scale().addTo(this.map);

      this.map.pm.addControls({
        position: 'topleft',
        drawMarker: false,
        drawCircleMarker: false,
        drawPolyline: false, // draw streight line
        drawRectangle: false,
        drawPolygon: true, // draw new shapes
        drawCircle: false,
        editMode: true, // edit shapes
        dragMode: false,
        cutPolygon: false,
        removalMode: false, // erase shapes
        pinningOption: false,
        snappingOption: false,
      });
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
