<template>
  <div
    :class="{ mapWrapper: true, fullscreen }"
    @dblclick="!fullscreen && toggleFullscreen()"
  >
    <div :id="_uid + '_map'" class="cityMap"></div>
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
      fullscreen: false,
    };
  },
  mounted() {
    this.initMap();
  },
  methods: {
    initMap() {
      // eslint-disable-next-line
      this.map = L.map(`${(this as any)._uid}_map`)
        .setView(this.coordinates, 13);
      this.zoomControl(this.map, false);
      // this.drag(this.map, false);

      L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> רינגו נדלן',
      }).addTo(this.map);

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
    center(map: L.Map) {
      const cords: L.LatLng = this.coordinates;

      // to force rerender map tiles
      map.invalidateSize();
      (map.attributionControl as any)._map.fitBounds(cords); // eslint-disable-line
    },
    zoomControl(map: L.Map, state: boolean) {
      map.touchZoom[state ? 'enable' : 'disable']();
      map.doubleClickZoom[state ? 'enable' : 'disable']();
      map.scrollWheelZoom[state ? 'enable' : 'disable']();
      map.boxZoom[state ? 'enable' : 'disable']();
      map.keyboard[state ? 'enable' : 'disable']();

      // eslint-disable-next-line
      state ? map.zoomControl.addTo(map) : map.zoomControl.remove();
    },
    drag(map: L.Map, state: boolean) {
      map.dragging[!state ? 'disable' : 'enable']();
    },
    toggleFullscreen() {
      this.fullscreen = !this.fullscreen;
      this.$nextTick(() => {
        this.center(this.map);
        this.zoomControl(this.map, this.fullscreen);
        this.drag(this.map, this.fullscreen);
      });
    },
  },
});
</script>

<style lang="scss" scoped>
.mapWrapper {
  &.fullscreen {
    position: fixed;
    width: 100%;
    height: 100%;
    left: 0;
    top: 0;
    background: rgba(51, 51, 51, 0.7);
    z-index: 99999;
    >div.cityMap {
      height: 100vh;
      width: 100vw;
      ::v-deep {
        .leaflet-pm-toolbar {
          display: block;
        }
      }
    }
  }
  .cityMap {
    width: 100%;
    height: 200px;
    ::v-deep {
      .leaflet-control-attribution,
      .leaflet-pm-toolbar {
        display: none;
      }
    }
  }
}
</style>
