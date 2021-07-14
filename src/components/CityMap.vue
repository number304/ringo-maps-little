<template>
  <div
    :class="{
      mapWrapper: true,
      fullscreen
    }"
    @dblclick="!fullscreen && toggleFullScreen()"
  >
    <!-- Here is the map -->
    <div :id="_uid + '_map'" class="myMap"></div>
    <!-- Here are the custom buttons -->
    <div :class="[fullscreen ? 'menuButtons' : 'hiddenButtons']">
      <div class="menu">
        <!-- Exit fullscreen -->
        <v-btn
          fab
          dark
          class="orange darken-2 btn"
          @click="
            toggleFullScreen();
            center(map);
          "
          title="Exit Fullscreen"
        >
          <v-icon dark>mdi-fullscreen-exit</v-icon>
        </v-btn>
        <!-- Center city -->
        <v-btn fab dark class="orange darken-2 btn" @click="center(map)" title="Center City">
          <v-icon dark>mdi-image-filter-center-focus</v-icon>
        </v-btn>
        <!-- Toggle neighborhoods -->
        <v-btn
          fab
          dark
          class="orange darken-2 btn"
          :disabled="neighborhoods.length === 0"
          @click.prevent="toggleNeighborhoods(map)"
          title="Toggle Neighborhoods"
        >
          <v-icon dark>mdi-home-group</v-icon>
        </v-btn>
      </div>
    </div>

    <!-- Buttons related to the selected neighborhood -->
    <template v-if="fullscreen && selected.neighborhood">
      <div class="fixed-center-top menu">
        <h2 class="text-center">
          {{ selected.neighborhood.name.find(name => name.language == "en").label }}
        </h2>
        <div class="mt-2">
          <!-- Center neighborhood -->
          <v-btn
            fab
            dark
            class="orange darken-2 btn"
            @click.prevent="centerArea(selected.neighborhood)"
            title="Center Neighborhood"
          >
            <v-icon dark>mdi-image-filter-center-focus-weak</v-icon>
          </v-btn>
          <!-- Edit neighborhood -->
          <v-btn
            fab
            dark
            class="orange darken-2 btn"
            title="Edit Neighborhood"
            @click.stop="$emit('editNeighborhood', selected.neighborhood)"
          >
            <v-icon dark>mdi-pencil</v-icon>
          </v-btn>

        </div>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import "@geoman-io/leaflet-geoman-free";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";

export default Vue.extend({
  props: {
    city: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      map: (null as unknown) as L.Map,
      neighborhoods: [],
      fullscreen: false,
      selected: {
        neighborhood: null
      },
    };
  },
  mounted() {
    this.initMap();
    this.loadNeighborhoods();
  },
  methods: {
    initMap() {
      this.map = L.map((this as any)._uid + "_map");
      L.tileLayer("http://{s}.tile.osm.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> רינגו נדלן'
      }).addTo(this.map);
      this.center(this.map);
      this.zoomControl(this.map, false);
      this.drag(this.map, false);

      this.map.pm.addControls({
        positions: {
          draw: "bottomleft",
          edit: "bottomleft"
        },
        drawMarker: false,
        drawCircleMarker: false,
        drawPolyline: false, // draw streight line
        drawRectangle: false,
        drawPolygon: true,
        drawCircle: false,
        editMode: true, // edit shapes
        dragMode: false,
        cutPolygon: false,
        removalMode: true, // erase shapes
        pinningOption: false,
        snappingOption: false
      });

      // Creates an event listener that returns on console the
      // coordinates of the layer created by user
      this.map.on("pm:create", event => {
        console.log(event);
        const { layer } = event;
        const coords = (layer as any).getLatLngs();
        const polyedit = (layer as any).toGeoJSON();
        console.log(coords);
        console.log(polyedit);
      });

      this.cityLayer(this.map);
    },
    center(map: L.Map) {
      const cords: L.LatLng[] = this.city.payload[0].FeatureCollection.features.reduce(
        (o: L.LatLng[], v: any) => {
          return o.concat(
            v.geometry.coordinates[0][0].map((x: any) => {
              return L.GeoJSON.coordsToLatLng(x);
            })
          );
        },
        []
      );

      // force rerender map tiles
      map.invalidateSize();
      // console.log(cords);
      (map.attributionControl as any)._map.fitBounds(cords);
    },
    centerArea(area: any) {
      (this.map.attributionControl as any)._map.fitBounds(
        area.FeatureCollection.features[0].geometry.coordinates[0][0].map((x: any) =>
          L.GeoJSON.coordsToLatLng(x)
        )
      );
    },
    cityLayer(map: L.Map) {
      // If the object map has a cityLayer, delete it
      if ((map as any).cityLayerGroup) {
        map.removeLayer((map as any).cityLayerGroup);
        delete (map as any).cityLayerGroup;
      }

      // Now create a new one
      (map as any).cityLayerGroup = new L.LayerGroup();

      // Get the information inside city object of his LayerGroup
      this.city.payload[0].FeatureCollection.features.forEach((feature: any) => {
        (map as any).cityLayerGroup.addLayer(
          L.geoJSON(feature.geometry, {
            style: () => {
              return { color: "#007bff", weight: 2, opacity: 0.65 };
            },
            onEachFeature: (feature, layer) => {
              layer.on("pm:update", event => {
                // Creates an event listener for any modification
                // of a pre-existent polygon
                console.log(event);
              });
            }
          })
        );
      });

      // Insert the LayerGroup from city object to map
      (map as any).cityLayerGroup.addTo(map);
    },
    zoomControl(map: L.Map, state: boolean) {
      map.touchZoom[state ? "enable" : "disable"]();
      map.doubleClickZoom[state ? "enable" : "disable"]();
      map.scrollWheelZoom[state ? "enable" : "disable"]();
      map.boxZoom[state ? "enable" : "disable"]();
      map.keyboard[state ? "enable" : "disable"]();

      state ? map.zoomControl.addTo(map) : map.zoomControl.remove();
    },
    drag(map: L.Map, state: boolean) {
      map.dragging[state ? "enable" : "disable"]();
    },
    toggleFullScreen() {
      this.fullscreen = !this.fullscreen;
      if (!this.fullscreen) {
        if ((this.map as any).neighborhoodsLayerGroup) {
          this.map.removeLayer((this.map as any).neighborhoodsLayerGroup);
          delete (this.map as any).neighborhoodsLayerGroup;
        }
      }
      this.$nextTick(() => {
        this.center(this.map);
        this.zoomControl(this.map, this.fullscreen);
        this.drag(this.map, this.fullscreen);
      });
    },
    loadNeighborhoods() {
      const cityId = this.city.payload[0]._id;

      // If this city has an Array with _id property, then it's true
      if (cityId) {
        // Neighborhoods from city object inserted in same
        // name data value
        this.neighborhoods = this.city.payload[0].neighborhoods;
      } else {
        console.log("No city hood in local data files");
        console.log(
          `https://agents.ringoboot.com/api/v1.0/areas/city/${cityId}/?FeatureCollection`
        );
      }
    },
    toggleNeighborhoods(map: L.Map, draw?: boolean) {
      if (!this.neighborhoods.length) return;

      this.$set(this.selected, "neighborhood", null);

      if ((map as any).neighborhoodsLayerGroup) {
        map.removeLayer((map as any).neighborhoodsLayerGroup);
        delete (map as any).neighborhoodsLayerGroup;
        if (!draw) return;
      }

      (map as any).neighborhoodsLayerGroup = new L.LayerGroup();

      // A loop that will add all the hoods into a layer group
      // in the map, that are ignored in City view
      for (let i = 0; i < this.neighborhoods.length; i++) {
        const neighborhood: any = this.neighborhoods[i];
        const neighborhoodName = neighborhood.name.find((x: any) => x.language == "en").label;

        (map as any).neighborhoodsLayerGroup.addLayer(
          L.geoJSON(neighborhood.FeatureCollection.features[0].geometry, {
            pmIgnore: true, // To ignore the hoods in City view
            onEachFeature: (feature: any, layer: any) => {
              if (neighborhoodName) {
                layer.on({
                  // Event to change the value of selected
                  // to the last hood selected
                  click: (event: any) => {
                    this.$emit("clickArea", [event, neighborhood, this.city.payload[0]]);
                    this.$set(this.selected, "neighborhood", neighborhood);
                    setTimeout(() => {
                      layer.bindPopup(neighborhoodName);
                    }, 500);
                  }
                });
              }
            },
            style: () => {
              return { color: "#ff8900", weight: 2, opacity: 0.65 };
            }
          })
        );
      }

      (map as any).neighborhoodsLayerGroup.addTo(map);
    }
  },
  watch: {
    neighborhoods: {
      deep: true,
      immediate: false,
      handler: function(val, oldVal) {
        if (!val.length || !oldVal.length) return;
        this.toggleNeighborhoods(this.map, true);
      }
    }
  }
});
</script>

<style lang="scss" scoped>
$orange: #ff8900;
$dark: #0e4275;
$success: #3f9967;

.mapWrapper {
  &.fullscreen {
    position: fixed;
    width: 100%;
    height: 100%;
    left: 0;
    top: 0;
    background: rgba(51, 51, 51, 0.7);
    z-index: 401;
    > div.myMap {
      height: 100vh;
      width: 100vw;
      ::v-deep {
        .leaflet-pm-toolbar {
          display: block;
        }
      }
    }
    .menuButtons {
      position: absolute;
      z-index: 1030;
      right: 0.3em;
      top: 0.5em;
      padding: 0.5em;
    }
    .menu {
      display: flex;
      &.fixed-center-top {
        align-items: center;
        .btn {
          margin: 8px;
        }
      }
      flex-direction: column;
      .btn {
        margin-bottom: 8px;
      }
    }
    .fixed-center-top {
      position: fixed;
      top: 4em;
      left: 50%;
      margin-top: -50px;
      margin-left: -60px;
      z-index: 999;
    }
  }

  > div.myMap {
    width: 100%;
    height: 200px;
    ::v-deep {
      .leaflet-control-attribution,
      .leaflet-pm-toolbar {
        display: none;
      }
    }
  }
  .hiddenButtons {
    display: none;
  }
}
</style>
