<template>
  <div
    :class="{
      mapWrapper: true,
      fullscreen,
    }"
    @dblclick="
      !fullscreen && toggleFullScreen();
      $emit('fullscreen');
    "
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
            $emit('fullscreenOut');
          "
          title="Exit Fullscreen"
        >
          <v-icon dark>mdi-fullscreen-exit</v-icon>
        </v-btn>
        <!-- Center city -->
        <v-btn
          fab
          dark
          class="orange darken-2 btn"
          @click="center(map)"
          title="Center City"
        >
          <v-icon dark>mdi-image-filter-center-focus</v-icon>
        </v-btn>
        <!-- Toggle neighborhoods -->
        <v-btn
          fab
          dark
          :class="[
            !neighborhoods.length
              ? 'red'
              : map.neighborhoodsLayerGroup
              ? 'green'
              : 'orange',
            'darken-2',
            'btn',
          ]"
          @click="
            $event.preventDefault();
            ((exists) => {
              if (exists) toggleNeighborhoods(map);
              toggleEdition();
            })(neighborhoods && neighborhoods.length);
          "
          title="Toggle Neighborhoods"
        >
          <v-icon dark>mdi-home-group</v-icon>
        </v-btn>
        <!-- Add cities to map -->
        <v-btn
          fab
          dark
          class="orange darken-2 btn"
          title="Display a city"
          @click="displayCityDialog"
        >
          <v-icon dark>mdi-city-variant-outline</v-icon>
        </v-btn>
      </div>
    </div>

    <!-- Buttons related to the selected neighborhood -->
    <template v-if="toggleAreaButtons">
      <div
        v-if="selectedNeighborhoods.length === 0"
        class="fixed-center-top menu"
      >
        <div class="nb-title-label pt-1 pb-2">
          <h2 class="text-center">
            {{ neighborhoodLabel }}
          </h2>
          <p class="mb-0 font-weight-bold" v-if="getArea.neighborhood.userMade">
            {{ areaHintSubtitle }}
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
            {{
              selectedNeighborhoods[0].name.find(
                (x) => x.language == $store.getters["i18n/current"]
              ).label
            }}
            selected.
          </span>
          <span v-else>
            {{ selectedNeighborhoods.length }} selected areas.
          </span>
        </p>
        <div class="mt-1">
          <!-- Merge Button -->
          <v-btn
            fab
            dark
            class="orange darken-2 btn"
            @click.stop="mergeSelectedNb"
            title="Merge neighborhoods"
          >
            <v-icon dark>mdi-table-merge-cells</v-icon>
          </v-btn>
          <!-- Exit Merge Mode -->
          <v-btn
            fab
            dark
            class="orange darken-2 btn"
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
        fab
        dark
        class="orange-darken-2 btn mr-2"
        @click.stop="cityDialog = true;cityNameDialog = true"
        title="Change city name"
        x-small
      >
        <v-icon>mdi-pencil</v-icon>
      </v-btn>
      <h2 class="text-center">
        {{
          city.name.find((x) => x.language == $store.getters["i18n/current"])
            .label
        }}
      </h2>
    </div>
    <div v-if="fullscreen" class="fixed-right-bottom">
      <div class="text-center">Edit Mode</div>
      <div class="text-center font-weight-bold light-green--text darken-4">
        {{ editCity ? "CITY" : "NEIGHBORHOODS" }}
      </div>
    </div>
    <!-- Dialog when editing city area layer -->
    <v-dialog v-model="confirmEditCity" max-width="240px" persistent>
      <v-card class="py-4">
        <h3 class="mb-4">Confirm changes?</h3>
        <v-divider></v-divider>
        <div class="mt-4">
          <v-btn color="green darken-1" text @click.stop="patchCity">
            Yes
          </v-btn>
          <v-btn color="green darken-1" text @click.stop="emitModalForCity">
            Create new city
          </v-btn>
          <v-btn color="green darken-1" text @click.stop="restoreCityGeoJson">
            Cancel
          </v-btn>
        </div>
      </v-card>
    </v-dialog>
    <!-- Dialog for editing name or display more cities -->
    <v-dialog v-model="cityDialog" max-width="400px" persistent>
      <!-- Card to edit city name -->
      <v-card v-if="cityNameDialog" class="pt-4 pb-2">
        <v-text-field
          class="mx-4"
          :key="name.language"
          :label="`Change city name in ${name.language}`"
          v-for="name in cityNames"
          v-model="name.label"
        ></v-text-field>
        <v-divider></v-divider>
        <div class="mt-2">
          <v-btn color="green darken-1" text @click.stop="changeCityName">
            Confirm
          </v-btn>
          <v-btn
            color="green darken-1"
            text
            @click.stop="cityDialog = false;cityNameDialog = false"
          >
            Cancel
          </v-btn>
        </div>
      </v-card>
      <!-- Card to select a city to display -->
      <v-card v-if="selectCityDialog" class="pt-4 pb-2">
        <h3 class="text-left text-h5 mx-4">
          Add cities to this map
        </h3>
        <v-divider class="mt-2"></v-divider>
        <v-autocomplete
          class="mx-4"
          multiple
          menu-props="closeOnContentClick"
          :items="$store.getters.allCities"
          :item-text="getItemLanguage()"
          return-object
          v-model="addedCities"
          :filter="filterCities"
        >
          <template v-slot:selection="data">
            <v-chip
              v-bind="data.attrs"
              :input-value="data.selected"
              close
              @click="data.select"
              @click:close="removeCity(data.item)"
            >
              {{ data.item.name.find((x) => x.language === $store.getters["i18n/current"]).label }}
            </v-chip>
          </template>
          <template v-slot:item="{ item }">
            {{ item.name.find((x) => x.language === $store.getters["i18n/current"]).label }}
          </template>
        </v-autocomplete>
        <v-btn
          color="green darken-1" text
          @click.stop="cityDialog = false;cityNameDialog = false"
        >
          Close
        </v-btn>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { mapGetters, mapActions } from "vuex";

import L from "leaflet";
import "leaflet/dist/leaflet.css";

import "@geoman-io/leaflet-geoman-free";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";

import dissolve from "@turf/dissolve";
import booleanContains from "@turf/boolean-contains";
import booleanIntersects from '@turf/boolean-intersects';
import { featureCollection, polygon } from "@turf/helpers";

export default Vue.extend({
  props: {
    city: {
      type: Object,
      required: true,
    },
    cityIndex: {
      required: true,
      type: Number,
    },
  },
  data() {
    return {
      addedCities: [],
      cityDialog: false,
      cityGeoJson: null as unknown as L.GeoJSON,
      cityNameDialog: false,
      cityNames: [] as any[],
      confirmEditCity: false,
      customController: null as unknown as L.Control.Layers,
      editCity: true,
      fullscreen: false,
      map: null as unknown as L.Map,
      neighborhoods: [],
      newCityLayer: null as any,
      selectCityDialog: false,
      selectedNeighborhoods: [] as any[],
    };
  },
  mounted() {
    this.initMap();
    this.loadNeighborhoods();
  },
  computed: {
    ...mapGetters(["getArea", "getRedrawCity"]),
    neighborhoodLabel(): string {
      return this.getArea.neighborhood.name.find(
        (x: any) => x.language == this.$store.getters["i18n/current"]
      ).label;
    },
    areaHintSubtitle(): string {
      if (this.getArea.neighborhood.areaType) {
        const type = this.getArea.neighborhood.areaType;
        if (type === "neighborhood") return "(Custom hood)";
        else return "(Custom area)";
      } else return "(Custom hood)";
    },
    toggleAreaButtons(): boolean {
      return !!(this.fullscreen &&
        this.getArea.neighborhood &&
        this.getArea.neighborhood._id &&
        !this.editCity);
    },
  },
  methods: {
    ...mapActions([
      "setArea",
      "cleanNeighborhood",
      "setCityArea",
      "editCityName",
      "toggleRedrawCity",
    ]),
    initMap() {
      this.map = L.map((this as any)._uid + "_map");
      L.tileLayer("http://{s}.tile.osm.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> רינגו נדלן',
      }).addTo(this.map);
      this.center(this.map);
      this.zoomControl(this.map, false);
      this.drag(this.map, false);

      this.map.pm.addControls({
        positions: {
          draw: "bottomleft",
          edit: "bottomleft",
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
        rotateMode: false,
      });

      // Creates an event listener that returns on console the
      // coordinates of the layer created by user
      this.map.on("pm:create", (event) => {
        const { layer } = event;
        // const coords = (layer as any).getLatLngs();
        const polyedit = (layer as any).toGeoJSON();
        const newArea = {
          FeatureCollection: {
            type: "FeatureCollection",
            features: [
              {
                geometry: {
                  coordinates: [polyedit.geometry.coordinates],
                  type: "MultiPolygon",
                },
                type: "Feature",
              },
            ],
          },
          name: [
            { label: "", language: "he" },
            { label: "", language: "en" },
            { label: "", language: "ar" },
          ],
        };
        this.newCityLayer = layer;

        if (this.editCity) {
          (this.cityGeoJson as any).geometry.coordinates.push(
            polyedit.geometry.coordinates
          );

          (this.cityGeoJson as any).properties.neighborhood = newArea;

          this.confirmEditCity = true;
        } else {
          this.setArea([event, newArea, this.city]);
          this.checkNewNb(polyedit);
          this.map.removeLayer(layer);
        }
      });

      this.cityLayer(this.map);
      this.cityNames = this.city.name;
    },
    center(map: L.Map) {
      const cords: L.LatLng[] = this.city.FeatureCollection.features.reduce(
        (o: L.LatLng[], v: any) => {
          return o.concat(
            v.geometry.coordinates.map((pol: any[]) =>
              pol[0].map((x: any) => {
                return L.GeoJSON.coordsToLatLng(x);
              })
            )
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
        area.FeatureCollection.features[0].geometry.coordinates[0][0].map(
          (x: any) => L.GeoJSON.coordsToLatLng(x)
        )
      );
    },
    changeCityName() {
      this.editCityName([this.city._id, this.cityNames]);
      this.cityDialog = false;
      this.cityNameDialog = false;
    },
    checkNewNb(polyedit: any) {
      const cityCoords = this.city.FeatureCollection.features[0].geometry.coordinates;
      const intersects = () => {
        for (let i = 0; i < cityCoords.length; i++) {
          const pol = polygon(cityCoords[i]);
          if (booleanIntersects(pol, polyedit)) return true;
        }
        return false;
      }

      if (intersects()) {
        const nbIsContained = () => {
          for (let i= 0; i < cityCoords.length; i++) {
            const pol = polygon(cityCoords[i]);
            if (booleanContains(pol, polyedit)) return true;
          }
          return false
        }

        if (nbIsContained()) this.$emit("editNeighborhood");
        else {
          const ask = confirm('Neighborhood out of city area, continue?');
          if (ask) this.$emit("editNeighborhood", true);
        }
      } else {
        const ask = confirm('Neighborhood out of city area, continue?');
        if (ask) this.$emit("editNeighborhood");
      }
    },
    citiesLayer(map: L.Map) {
      if ((map as any).citiesLayerGroup) {
        map.removeLayer((map as any).citiesLayerGroup)
        delete (map as any).citiesLayerGroup
      }

      if (this.addedCities.length < 1) return;

      (map as any).citiesLayerGroup = new L.LayerGroup()

      for (let i = 0; i < this.addedCities.length; i++) {
        const city: any = this.addedCities[i];

        (map as any).citiesLayerGroup.addLayer(
          L.geoJSON(city.FeatureCollection.features[0], {
            pmIgnore: true,
            style: function () {
              return { color: '#007bff', weight: 2, opacity: 0.65 }
            }
          })
        )
      }

      (map as any).citiesLayerGroup.addTo(map);
    },
    cityLayer(map: L.Map) {
      if ((map as any).cityLayerGroup) {
        map.removeLayer((map as any).cityLayerGroup);
        delete (map as any).cityLayerGroup;
      }

      (map as any).cityLayerGroup = new L.LayerGroup();

      this.city.FeatureCollection.features.forEach((feature: any) => {
        this.cityGeoJson = JSON.parse(JSON.stringify(feature));
        (map as any).cityLayerGroup.addLayer(
          L.geoJSON(feature.geometry, {
            style: () => {
              return { color: "#007bff", weight: 2, opacity: 0.65 };
            },
            onEachFeature: (feature, layer) => {
              layer.on("pm:update", (event) => {
                const { layer } = event;
                const polyEdit = (layer as any).toGeoJSON();

                (this.cityGeoJson as any).geometry = polyEdit.geometry;
                this.confirmEditCity = true;
              });
            },
          })
        );
      });

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
    displayCityDialog () {
      this.cityDialog = true;
      this.selectCityDialog = true;
    },
    drag(map: L.Map, state: boolean) {
      map.dragging[state ? "enable" : "disable"]();
    },
    emitModalForCity() {
      this.setArea([{}, (this.cityGeoJson as any).properties.neighborhood, this.city]);
      this.$emit("editNeighborhood", false, true);
      this.restoreCityGeoJson();
    },
    exitSelectMode() {
      for (let i = 0; i < this.selectedNeighborhoods.length; i++) {
        const neighborhood = this.selectedNeighborhoods[i];
        const neighborhoodName = neighborhood.name[1];
        const selectedLayerId = neighborhood.leaflet_id + 1;
        const neighborhoodColor = (neighborhood as any).color
          ? (neighborhood as any).color.active
          : "#ff8900";

        (this.map as any).neighborhoodsLayerGroup.eachLayer(
          (layer: L.Layer) => {
            if (
              selectedLayerId ===
              (this.map as any).neighborhoodsLayerGroup.getLayerId(layer)
            ) {
              layer.removeFrom(this.map);

              (this.map as any).neighborhoodsLayerGroup.addLayer(
                L.geoJSON(neighborhood.FeatureCollection.features[0], {
                  pmIgnore: true,
                  onEachFeature: (feature: any, layer: any) => {
                    let selected = false;
                    const styleObject = (color: string) => {
                      return { color: color, weight: 2, opacity: 0.65 };
                    };

                    layer.on({
                      click: (event: any) => {
                        this.setArea([event, neighborhood, this.city]);
                        if (
                          ["ctrlKey", "metaKey", "shiftKey"].filter(
                            (key) => event.originalEvent[key]
                          ).length
                        ) {
                          if (!selected) {
                            if (this.selectedNeighborhoods.length < 5) {
                              neighborhood.leaflet_id = (
                                this.map as any
                              ).neighborhoodsLayerGroup.getLayerId(layer);
                              this.selectedNeighborhoods.push(neighborhood);
                              layer.setStyle(styleObject("#E30202"));
                              selected = !selected;
                            } else alert("Reached limit of 5 neighborhoods.");
                          } else {
                            this.selectedNeighborhoods =
                              this.selectedNeighborhoods.filter(
                                (nb) => nb.name[1].label != neighborhoodName
                              );
                            layer.setStyle(styleObject(neighborhoodColor));
                            selected = !selected;
                          }
                        }
                      },
                    });
                  },
                  style: () => {
                    return {
                      color: neighborhoodColor,
                      weight: 2,
                      opacity: 0.65,
                    };
                  },
                })
              );
            }
          }
        );
      }

      this.selectedNeighborhoods = [];
    },
    filterCities: function (item: any, queryText: string) {
      const match = new RegExp(queryText, "ig");
      return !!item.name.filter((x: any) => x.label.match(match)).length;
    },
    getItemLanguage: function (): string {
      const language = this.$store.getters["i18n/current"]
      if (language === 'he') return 'name[0].label'
      else if (language === 'en') return 'name[1].label'
      else return 'name[2].label'
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
      const cityId = this.city._id;

      if (cityId && this.city.areas && Array.isArray(this.city.areas)) {
        const customAreas = this.city.areas.filter(
          (area: any) => area.areaType !== 'neighborhood' && area.areaType !== 'neighbourhood'
        );

        (map as any).customAreasLayerGroup = new L.LayerGroup();

        for (let i = 0; i < customAreas.length; i++) {
          const customArea: any = customAreas[i];
          const areaName = customArea.name.find(
            (x: any) => x.language == "en"
          ).label;
          const areaColor = (customArea as any).color
            ? (customArea as any).color.active
            : "#ff8900";

          (map as any).customAreasLayerGroup.addLayer(
            L.geoJSON(customArea.FeatureCollection.features[0], {
              pmIgnore: true,
              onEachFeature: (feature: any, layer: any) => {
                if (areaName) {
                  let selected = false;
                  const styleObject = (color: string) => {
                    return { color: color, weight: 2, opacity: 0.65 };
                  };

                  layer.on({
                    click: (event: any) => {
                      this.setArea([event, customArea, this.city]);
                      if (
                        ["ctrlKey", "metaKey", "shiftKey"].filter(
                          (key) => event.originalEvent[key]
                        ).length
                      ) {
                        if (!selected) {
                          if (this.selectedNeighborhoods.length < 5) {
                            customArea.leaflet_id = (
                              map as any
                            ).customAreasLayerGroup.getLayerId(layer);
                            this.selectedNeighborhoods.push(customArea);
                            layer.setStyle(styleObject("#E30202"));
                            selected = !selected;
                          } else alert("Reached limit of 5 neighborhoods.");
                        } else {
                          this.selectedNeighborhoods =
                            this.selectedNeighborhoods.filter(
                              (nb) => nb.name[1].label != areaName
                            );
                          layer.setStyle(styleObject(areaColor));
                          selected = !selected;
                        }
                      }
                    },
                  });
                }
              },
              style: () => {
                return { color: areaColor, weight: 2, opacity: 0.65 };
              },
            })
          );
        }
        (map as any).customAreasLayerGroup.addTo(map);

        const overlays = { Custom: (map as any).customAreasLayerGroup };
        this.customController = L.control.layers(undefined, overlays, {
          position: "bottomright",
        });
        this.customController.addTo(map);
      }
    },
    loadNeighborhoods() {
      const cityId = this.city._id;

      // If this city has an Array with id property, then it's true
      if (cityId && this.city.areas && Array.isArray(this.city.areas)) {

        const areaTypes = [
          "neighbourhood",
          "cityArea",
          undefined,
          "neighborhood",
        ];

        this.neighborhoods = this.city.areas.filter(
          (area: any) => areaTypes.indexOf(area.areaType) != -1
        );
      } else {
        console.log("No city hood in local data files");
        console.log(
          `https://agents.ringoboot.com/api/v1.0/areas/city/${cityId}/?FeatureCollection`
        );
      }
    },
    mergeSelectedNb() {
      const nbCollection: any = featureCollection(
        this.selectedNeighborhoods.reduce((total: any[], nb: any): any[] => {
          nb.FeatureCollection.features[0].geometry.coordinates.map(
            (pol: any[]) => {
              total.push(polygon(pol));
            }
          );
          return total;
        }, [])
      );

      const dissolved = dissolve(nbCollection);

      const nbIDs = this.selectedNeighborhoods.map(nb => nb._id);

      if (dissolved.features.length < 2) {
        const newNeighborhood = {
          FeatureCollection: dissolved,
          name: [
            { label: "", language: "he" },
            { label: "", language: "en" },
            { label: "", language: "ar" },
          ],
          IDsToErase: nbIDs,
        };

        this.setArea([{}, newNeighborhood, this.city]);
        this.$emit("editNeighborhood");
        this.selectedNeighborhoods = [];
      } else {
        alert(
          "There are neighborhoods who don't touch each other. Edit them and try again."
        );
      }
    },
    patchCity() {
      if ((this.cityGeoJson as any).properties.neighborhood) {
        const newNeighborhood = (this.cityGeoJson as any).properties
          .neighborhood;
        delete (this.cityGeoJson as any).properties.neighborhood;

        this.setArea([{}, newNeighborhood, this.city]);
        this.$emit("editNeighborhood");

        this.setCityArea([
          this.city._id,
          JSON.parse(JSON.stringify(this.cityGeoJson)),
          this.cityIndex
        ]);

        if (this.newCityLayer) {
          this.map.removeLayer(this.newCityLayer);
          this.cityLayer(this.map);
          this.newCityLayer = null;
        }

        if ((this.map as any).neighborhoodsLayerGroup) this.toggleNeighborhoods(this.map, true, true);
      } else {
        this.setCityArea([
          this.city._id,
          JSON.parse(JSON.stringify(this.cityGeoJson)),
          this.cityIndex
        ]);
      }

      this.confirmEditCity = false;
    },
    removeCity (city: any) {
      this.addedCities = this.addedCities.filter((area: any) => area._id !== city._id)
    },
    restoreCityGeoJson() {
      this.cityGeoJson = this.city.FeatureCollection.features[0];
      if (this.newCityLayer) {
        this.map.removeLayer(this.newCityLayer);
        this.newCityLayer = null;
      }
      this.confirmEditCity = false;
      this.cityLayer(this.map);

      if (!this.editCity) {
        this.toggleNeighborhoods(this.map);
        this.toggleEdition();
      }
    },
    toggleEdition() {
      this.editCity = !this.editCity;
      this.cleanNeighborhood();
    },
    toggleNeighborhoods(map: L.Map, draw?: boolean, changeEdit?: boolean) {
      if (!this.neighborhoods.length) return;
      if (!this.fullscreen) return;

      if (changeEdit) this.editCity = false;

      if ((map as any).neighborhoodsLayerGroup) {
        map.removeLayer((map as any).neighborhoodsLayerGroup);
        delete (map as any).neighborhoodsLayerGroup;

        map.removeLayer((map as any).customAreasLayerGroup);
        delete (map as any).customAreasLayerGroup;
        map.removeControl(this.customController);

        if (!draw) return;
      }

      (map as any).neighborhoodsLayerGroup = new L.LayerGroup();

      const neighborhoods = this.neighborhoods.filter((nb: any) =>
        nb.areaType === 'neighborhood' || nb.areaType === 'neighbourhood')

      // A loop that will add all the hoods into a layer group
      // in the map, that are ignored in City view
      for (let i = 0; i < neighborhoods.length; i++) {
        const neighborhood: any = neighborhoods[i];
        const neighborhoodName = neighborhood.name.find(
          (x: any) => x.language == "en"
        ).label;
        const neighborhoodColor = (neighborhood as any).color
          ? (neighborhood as any).color.active
          : "#ff8900";

        (map as any).neighborhoodsLayerGroup.addLayer(
          L.geoJSON(neighborhood.FeatureCollection.features[0], {
            pmIgnore: true, // To ignore the hoods in City view
            onEachFeature: (feature: any, layer: any) => {
              if (neighborhoodName) {
                let selected = false;
                const styleObject = (color: string) => {
                  return { color: color, weight: 2, opacity: 0.65 };
                };

                layer.on({
                  click: (event: any) => {
                    this.setArea([event, neighborhood, this.city]);
                    if (
                      ["ctrlKey", "metaKey", "shiftKey"].filter(
                        (key) => event.originalEvent[key]
                      ).length
                    ) {
                      if (!selected) {
                        if (this.selectedNeighborhoods.length < 5) {
                          neighborhood.leaflet_id = (
                            map as any
                          ).neighborhoodsLayerGroup.getLayerId(layer);
                          this.selectedNeighborhoods.push(neighborhood);
                          layer.setStyle(styleObject("#E30202"));
                          selected = !selected;
                        } else alert("Reached limit of 5 neighborhoods.");
                      } else {
                        this.selectedNeighborhoods =
                          this.selectedNeighborhoods.filter(
                            (nb) => nb.name[1].label != neighborhoodName
                          );
                        layer.setStyle(styleObject(neighborhoodColor));
                        selected = !selected;
                      }
                    }
                  },
                });
              }
            },
            style: function () {
              return { color: neighborhoodColor, weight: 2, opacity: 0.65 };
            },
          })
        );
      }

      (map as any).neighborhoodsLayerGroup.addTo(map);
      this.loadCustomAreasLayer(this.map);
    },
  },
  watch: {
    neighborhoods: {
      deep: true,
      immediate: false,
      handler: function (val, oldVal) {
        if (!val.length || !oldVal.length) return;
        this.toggleNeighborhoods(this.map, true, true);
      },
    },
    city: {
      deep: true,
      handler: function () {
        this.loadNeighborhoods();
        this.cityLayer(this.map);
      },
    },
    getRedrawCity: {
      handler: function () {
        if (this.getRedrawCity) {
          this.loadNeighborhoods();
          this.cityLayer(this.map);
          this.toggleRedrawCity();
        }
      }
    },
    addedCities: {
      // deep: true,
      handler: function () {
        this.citiesLayer(this.map)
      }
    }
  },
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
