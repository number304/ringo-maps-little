<template>
  <div
    :class="{
      mapWrapper: true,
      fullscreen
    }"
    @dblclick="!fullscreen && toggleFullScreen();$emit('fullscreen')"
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
            $emit('fullscreenOut')
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
          :class="[!neighborhoods.length ? 'red' : map.neighborhoodsLayerGroup ? 'green': 'orange', 'darken-2', 'btn']"
          @click.prevent="(exists=>{if(exists)toggleNeighborhoods(map);toggleEdition()})(neighborhoods.length)"
          title="Toggle Neighborhoods"
        >
          <v-icon dark>mdi-home-group</v-icon>
        </v-btn>
      </div>
    </div>

    <!-- Buttons related to the selected neighborhood -->
    <template v-if="toggleAreaButtons">
      <div v-if="selectedNeighborhoods.length === 0" class="fixed-center-top menu">
        <div class="nb-title-label pt-1 pb-2">
          <h2 class="text-center">
            {{ neighborhoodLabel }}
          </h2>
          <p
            class="mb-0 font-weight-bold"
            v-if="getArea.neighborhood.userMade"
          >
            (User made hood)
          </p>
        </div>
        <div class="mt-1">
          <!-- Center neighborhood -->
          <v-btn
            fab
            dark
            class="orange darken-2 btn"
            @click.prevent="centerArea(getArea.neighborhood)"
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
            @click.stop="$emit('editNeighborhood')"
          >
            <v-icon dark>mdi-pencil</v-icon>
          </v-btn>

        </div>
      </div>

      <!-- Selection Mode header -->
      <div v-else class="fixed-center-top menu">
        <h2 class="text-center">Merge Mode</h2>
        <p class="text-center font-weight-bold mb-0">
          <span v-if="selectedNeighborhoods.length < 2">
            {{ selectedNeighborhoods[0].name.find(x=>x.language==$store.getters['i18n/current']).label }} selected.
          </span>
          <span v-else>
            {{ selectedNeighborhoods.length }} selected areas.
          </span>
        </p>
        <div class="mt-1">
          <!-- Merge Button -->
          <v-btn
            fab dark class="orange darken-2 btn"
            @click.stop="mergeSelectedNb"
            title="Merge neighborhoods"
          >
            <v-icon dark>mdi-table-merge-cells</v-icon>
          </v-btn>
          <!-- Exit Merge Mode -->
          <v-btn
            fab dark class="orange darken-2 btn"
            @click.stop="exitSelectMode"
            title="Exit merge mode"
          >
            <v-icon dark>mdi-location-exit</v-icon>
          </v-btn>
        </div>
      </div>
    </template>

    <div v-if="fullscreen" class="fixed-center-bottom d-flex">
      <v-btn
        fab dark class="orange-darken-2 btn mr-2"
        @click.stop="changeCityName"
        title="Change city name" x-small
      >
        <v-icon>mdi-pencil</v-icon>
      </v-btn>
      <h2 class="text-center">{{ city.name.find(x=>x.language==$store.getters['i18n/current']).label }}</h2>
    </div>
    <div v-if="fullscreen" class="fixed-right-bottom">
      <div class="text-center">Edit Mode</div>
      <div class="text-center font-weight-bold light-green--text darken-4">{{editCity ? 'CITY' : 'NEIGHBORHOODS'}}</div>
    </div>
    <v-dialog v-model="confirmEditCity" max-width="240px" persistent>
      <v-card class="py-4">
        <h3 class="mb-4">Confirm changes?</h3>
        <v-divider></v-divider>
        <div class="mt-4">
          <v-btn
            color="green darken-1" text
            @click.stop="patchCity"
          >
            Yes
          </v-btn>
          <v-btn
            color="green darken-1" text
            @click.stop="restoreCityGeoJson"
          >
            Cancel
          </v-btn>
        </div>
      </v-card>
    </v-dialog>
    <v-dialog v-model="confirmCreateArea" max-width="240px" persistent>
      <v-card class="py-4">
        <h3 class="mb-4">Select a type of area</h3>
        <v-divider></v-divider>
        <div class="mt-4">
          <v-btn
            color="green darken-1" text
            @click.stop="emitModal('neighborhood')"
          >
            New neighborhood
          </v-btn>
          <v-btn
            color="green darken-1" text
            @click.stop="emitModal('custom')"
          >
            Custom area
          </v-btn>
        </div>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { mapGetters, mapActions } from 'vuex'

import L from "leaflet";
import "leaflet/dist/leaflet.css";

import "@geoman-io/leaflet-geoman-free";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";

import dissolve from '@turf/dissolve'
import { featureCollection, polygon } from '@turf/helpers';

export default Vue.extend({
  props: {
    city: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      cityGeoJson: null as unknown as L.GeoJSON,
      confirmCreateArea: false,
      confirmEditCity: false,
      customController: null as unknown as L.Control.Layers,
      editCity: true,
      fullscreen: false,
      map: (null as unknown) as L.Map,
      neighborhoods: [],
      newCityLayer: null as any,
      selectedNeighborhoods: [] as any[],
    };
  },
  mounted() {
    this.initMap();
    this.loadNeighborhoods();
  },
  computed: {
    ...mapGetters(['getArea']),
    neighborhoodLabel(): string {
      return this.getArea.neighborhood.name.find((x: any)=>x.language==this.$store.getters['i18n/current']).label
    },
    toggleAreaButtons(): boolean {
      return this.fullscreen
      && this.getArea.neighborhood
      && (this.getArea.neighborhood.id || this.getArea.neighborhood._id)
      && !this.editCity ? true : false
    },
  },
  methods: {
    ...mapActions(['setArea', 'cleanNeighborhood', 'setCityArea']),
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
        removalMode: false, // erase shapes
        pinningOption: false,
        snappingOption: false,
        rotateMode: false
      });

      // Creates an event listener that returns on console the
      // coordinates of the layer created by user
      this.map.on("pm:create", event => {
        const { layer } = event;
        // const coords = (layer as any).getLatLngs();
        const polyedit = (layer as any).toGeoJSON();
        const newNeighborhood = {
          FeatureCollection: {
            type: 'FeatureCollection',
            features: [{
              geometry: {
                coordinates: [polyedit.geometry.coordinates],
                type: 'MultiPolygon'
              },
              type: 'Feature'
            }]
          },
          name: [{label: '',language: 'he'},{label: '', language: 'en'},{label: '',language: 'ar'}]
        }
        this.newCityLayer = layer

        if (this.editCity) {
          (this.cityGeoJson as any).geometry
            .coordinates.push(polyedit.geometry.coordinates);

          (this.cityGeoJson as any).properties
            .neighborhood = newNeighborhood

          this.confirmEditCity = true
        }
        else {
          this.setArea([event, newNeighborhood, this.city])
          this.map.removeLayer(layer)
          // this.$emit('editNeighborhood')
          this.confirmCreateArea = true
        }
      });

      this.cityLayer(this.map);
    },
    center(map: L.Map) {
      const cords: L.LatLng[] = this.city.FeatureCollection.features.reduce(
        (o: L.LatLng[], v: any) => {
          return o.concat(
            v.geometry.coordinates.map((pol: any[]) => pol[0].map((x: any) => {
              return L.GeoJSON.coordsToLatLng(x);
            })
          ));
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
      // const isNb = false;

      // Now create a new one
      (map as any).cityLayerGroup = new L.LayerGroup();

      // Get the information inside city object of his LayerGroup
      this.city.FeatureCollection.features.forEach((feature: any) => {
        this.cityGeoJson = JSON.parse(JSON.stringify(feature));
        (map as any).cityLayerGroup.addLayer(
          L.geoJSON(feature.geometry, {
            style: () => {
              return { color: "#007bff", weight: 2, opacity: 0.65 };
            },
            onEachFeature: (feature, layer) => {
              layer.on("pm:update", event => {
                const { layer } = event
                const polyEdit = (layer as any).toGeoJSON();

                (this.cityGeoJson as any).geometry = polyEdit.geometry;
                console.log(polyEdit)
                this.confirmEditCity = true;
              });
            }
          })
        );
      });

      // Insert the LayerGroup from city object to map
      (map as any).cityLayerGroup.addTo(map);
    },
    changeCityName() {
      console.log('In development')
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
    emitModal(type: string) {
      if (type === 'custom') this.$emit('editNeighborhood', 'custom')
      else this.$emit('editNeighborhood')
      this.confirmCreateArea = false
    },
    exitSelectMode() {
      for(let i = 0; i < this.selectedNeighborhoods.length; i++) {
        const neighborhood = this.selectedNeighborhoods[i];
        const neighborhoodName = neighborhood.name[1]
        const selectedLayerId = neighborhood.leaflet_id + 1;
        const neighborhoodColor = (neighborhood as any).color ?
          (neighborhood as any).color.active : '#ff8900';

        (this.map as any).neighborhoodsLayerGroup.eachLayer((layer: L.Layer) => {
          if (selectedLayerId === (this.map as any).neighborhoodsLayerGroup.getLayerId(layer)) {
            layer.removeFrom(this.map);

            (this.map as any).neighborhoodsLayerGroup.addLayer(
              L.geoJSON(neighborhood.FeatureCollection.features[0], {
                pmIgnore: true,
                onEachFeature: (feature: any, layer: any) => {
                  let selected = false;
                  const styleObject = (color: string) => {
                    return { color: color, weight: 2, opacity: 0.65 }
                  }

                  layer.on({
                    click: (event: any) => {
                      this.setArea([event, neighborhood, this.city]);
                      if (['ctrlKey', 'metaKey', 'shiftKey'].filter(key=>event.originalEvent[key]).length) {
                        if (!selected) {
                          if (this.selectedNeighborhoods.length < 5) {
                            neighborhood.leaflet_id = (this.map as any).neighborhoodsLayerGroup.getLayerId(layer)
                            this.selectedNeighborhoods.push(neighborhood)
                            layer.setStyle(styleObject('#E30202'))
                            selected = !selected
                          }
                          else alert('Reached limit of 5 neighborhoods.')
                        }
                        else {
                          this.selectedNeighborhoods = this.selectedNeighborhoods
                            .filter((nb) => nb.name[1].label != neighborhoodName)
                          layer.setStyle(styleObject(neighborhoodColor))
                          selected = !selected
                        }
                      }
                    }
                  })
                },
                style: () => {
                  return { color: neighborhoodColor, weight: 2, opacity: 0.65 };
                }
              })
            )
          }
        })
      }


      this.selectedNeighborhoods = []
    },
    toggleFullScreen() {
      this.fullscreen = !this.fullscreen;
      if (!this.fullscreen) {
        if ((this.map as any).neighborhoodsLayerGroup) {
          this.map.removeLayer((this.map as any).neighborhoodsLayerGroup);
          delete (this.map as any).neighborhoodsLayerGroup;
        }
        if ((this.map as any).customAreasLayerGroup) {
          this.map.removeLayer((this.map as any).customAreasLayerGroup);
          delete (this.map as any).customAreasLayerGroup;
          this.map.removeControl(this.customController);
        }
      }
      this.$nextTick(() => {
        this.editCity = true;
        this.center(this.map);
        this.zoomControl(this.map, this.fullscreen);
        this.drag(this.map, this.fullscreen);
      });
    },
    loadCustomAreasLayer(map: L.Map) {
      const cityId = process.env.VUE_APP_RINGO_API.toLowerCase() === 'true' ? this.city._id:this.city.id;

      if (cityId && this.city.areas && Array.isArray(this.city.areas)) {
        const customAreas = this.city.areas.filter((area: any) => area.areaType === 'custom');

        (map as any).customAreasLayerGroup = new L.LayerGroup();

        for (let i = 0; i < customAreas.length; i++) {
          const customArea: any = customAreas[i];

          (map as any).customAreasLayerGroup.addLayer(
            L.geoJSON(customArea.FeatureCollection.features[0], {
              pmIgnore: true,
              onEachFeature: (feature: any, layer: any) => {
                layer.on({
                  click: () => {
                    layer.bindPopup(customArea.name[1].label)
                  }
                })
              }
            })
          )
        }
        (map as any).customAreasLayerGroup.addTo(map)

        const overlays = { 'Custom': (map as any).customAreasLayerGroup }
        this.customController = L.control.layers(undefined, overlays, { position: 'bottomright' });
        this.customController.addTo(map)
        }
    },
    loadNeighborhoods() {
      const cityId = process.env.VUE_APP_RINGO_API.toLowerCase() === 'true' ? this.city._id:this.city.id;

      // If this city has an Array with id property, then it's true
      if (cityId && this.city.areas && Array.isArray(this.city.areas)) {
        // Neighborhoods from city object inserted in same
        // name data value
        this.neighborhoods = this.city.areas.filter((area: any) => !area.areaType || area.areaType === 'neighborhood');
      } else {
        console.log("No city hood in local data files");
        console.log(
          `https://agents.ringoboot.com/api/v1.0/areas/city/${cityId}/?FeatureCollection`
        );
      }
    },
    mergeSelectedNb() {
      const nbCollection: any = featureCollection(
        this.selectedNeighborhoods.reduce(
          (total: any[], nb: any): any[] => {
            nb.FeatureCollection.features[0].geometry.coordinates.map(
              (pol: any[]) => {
                total.push(polygon(pol))
              }
            )
            return total
          }, []
      ))

      console.log(nbCollection)
      const dissolved = dissolve(nbCollection)
      console.log(dissolved)

      const nbIDs = this.selectedNeighborhoods.map(nb => (nb.id || nb._id))

      console.log(nbIDs)

      if (dissolved.features.length < 2) {
        const newNeighborhood = {
          'FeatureCollection': dissolved,
          'name': [{label: '',language: 'he'},{label: '', language: 'en'},{label: '',language: 'ar'}],
          'IDsToErase': nbIDs
        }

        this.setArea([{}, newNeighborhood, this.city])
        this.$emit('editNeighborhood')
        this.selectedNeighborhoods = []
      }
      else {
        alert(
          "There are neighborhoods who don't touch each other. Edit them and try again."
        )
      }
    },
    restoreCityGeoJson() {
      this.cityGeoJson = this.city.FeatureCollection.features[0]
      if (this.newCityLayer) {
        this.map.removeLayer(this.newCityLayer)
        this.newCityLayer = null;
      }
      this.confirmEditCity = false;
      this.cityLayer(this.map)

      if (!this.editCity) {
        this.toggleNeighborhoods(this.map)
        this.toggleEdition()
      }
    },
    patchCity() {
      if ((this.cityGeoJson as any).properties.neighborhood) {
        const newNeighborhood = (this.cityGeoJson as any).properties
          .neighborhood
        delete (this.cityGeoJson as any).properties.neighborhood

        this.setArea([{}, newNeighborhood, this.city])
        this.$emit('editNeighborhood')

        this.setCityArea([this.city.id || this.city._id, JSON.parse(
          JSON.stringify(this.cityGeoJson))])

        if (this.newCityLayer) {
          this.map.removeLayer(this.newCityLayer)
          this.newCityLayer = null;
        }
      }
      else this.setCityArea([this.city.id || this.city._id, JSON.parse(
          JSON.stringify(this.cityGeoJson))])

      this.confirmEditCity = false
    },
    toggleEdition() {
      this.editCity = !this.editCity
      this.cleanNeighborhood()
    },
    toggleNeighborhoods(map: L.Map, draw?: boolean, changeEdit?: boolean) {
      if (!this.neighborhoods.length) return;
      if (!this.fullscreen) return;

      if (changeEdit) this.editCity = false

      if ((map as any).neighborhoodsLayerGroup) {
        map.removeLayer((map as any).neighborhoodsLayerGroup);
        delete (map as any).neighborhoodsLayerGroup;

        map.removeLayer((map as any).customAreasLayerGroup);
        delete (map as any).customAreasLayerGroup;
        map.removeControl(this.customController);

        if (!draw) return;
      }

      (map as any).neighborhoodsLayerGroup = new L.LayerGroup();

      // A loop that will add all the hoods into a layer group
      // in the map, that are ignored in City view
      for (let i = 0; i < this.neighborhoods.length; i++) {
        const neighborhood: any = this.neighborhoods[i];
        const neighborhoodName = neighborhood.name.find((x: any) => x.language == "en").label;
        const neighborhoodColor = (this.neighborhoods[i] as any).color ?
          (this.neighborhoods[i] as any).color.active : '#ff8900';

        (map as any).neighborhoodsLayerGroup.addLayer(
          L.geoJSON(neighborhood.FeatureCollection.features[0], {
            pmIgnore: true, // To ignore the hoods in City view
            onEachFeature: (feature: any, layer: any) => {
              if (neighborhoodName) {
                let selected = false;
                const styleObject = (color: string) => {
                  return { color: color, weight: 2, opacity: 0.65 }
                }

                layer.on({
                  click: (event: any) => {
                    this.setArea([event, neighborhood, this.city]);
                    if (['ctrlKey', 'metaKey', 'shiftKey'].filter(key=>event.originalEvent[key]).length) {
                      if (!selected) {
                        if (this.selectedNeighborhoods.length < 5) {
                          neighborhood.leaflet_id = (map as any).neighborhoodsLayerGroup.getLayerId(layer)
                          this.selectedNeighborhoods.push(neighborhood)
                          layer.setStyle(styleObject('#E30202'))
                          selected = !selected
                        }
                        else alert('Reached limit of 5 neighborhoods.')
                      }
                      else {
                        this.selectedNeighborhoods = this.selectedNeighborhoods
                          .filter((nb) => nb.name[1].label != neighborhoodName)
                        layer.setStyle(styleObject(neighborhoodColor))
                        selected = !selected
                      }
                    }
                  }
                });
              }
            },
            style: () => {
              return { color: neighborhoodColor, weight: 2, opacity: 0.65 };
            }
          })
        );
      }

      (map as any).neighborhoodsLayerGroup.addTo(map);
      this.loadCustomAreasLayer(this.map);
    }
  },
  watch: {
    neighborhoods: {
      deep: true,
      immediate: false,
      handler: function(val, oldVal) {
        if (!val.length || !oldVal.length) return;
        this.toggleNeighborhoods(this.map, true, true);
      }
    },
    city: {
      handler: function() {
        this.loadNeighborhoods()
        this.cityLayer(this.map)
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
    .fixed-center-bottom {
      position: fixed;
      background-color: white;
      padding: 10px;
      border-radius: 10px;
      opacity: 0.85;
      bottom: 2em;
      left: 50%;
      margin-top: -50px;
      margin-left: -60px;
      z-index: 999;
    }
    .fixed-right-bottom {
      position: fixed;
      background-color: white;
      padding: 0 8px;
      border-radius: 10px;
      opacity: 0.85;
      bottom: 4em;
      right: 10px;
      z-index: 999;

      p {
        font-weight: bold;
        margin-top: 4px;
        margin-bottom: 4px;
      }
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

  .nb-title-label {
    background-color: white;
    padding: 0 8px;
    border-radius: 10px;
    opacity: 0.85;
  }
}
</style>
