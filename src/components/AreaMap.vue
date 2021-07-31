<template>
  <div class="mapWrapper">
    <div ref="areaMap" class="areaMap"></div>
    <div class="d-flex justify-center mt-4">
      <v-btn
        @click.prevent="centerArea(area)"
        dark
        color="orange darken-2"
      >
        Center
      </v-btn>
      <div class="mx-4"></div>
       <v-btn
        @click.prevent="areaLayer(map);$emit('restauredArea')"
        dark
        color="orange darken-2"
      >
        Reset map
      </v-btn>
    </div>
    <v-dialog v-model="showLayerDialog" max-width="300px" persistent>
      <v-card class="py-4">
        <h3 class="mb-4">
          How to use this marked area?
        </h3>
        <v-divider></v-divider>
        <div class="d-flex flex-column mt-4">
          <v-btn
            color="green darken-1" text
            @click.stop="setNewArea"
          >
            As a new neighborhood
          </v-btn>
          <v-btn
            color="green darken-1" text
            @click.stop="pushNewPolygon"
          >
            As part of this one
          </v-btn>
          <v-btn
            color="green darken-1" text
            @click.stop="showLayerDialog = false"
          >
            Cancel
          </v-btn>
        </div>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import "@geoman-io/leaflet-geoman-free";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";
import { mapActions } from 'vuex'

export default Vue.extend({
  props: {
    area: {
      type: Object,
      required: true,
    },
    dialog: {
      type: Boolean,
      required: true,
    },
    formIsChanged: {
      type: Boolean,
      required: true,
    },
    settings: {
      type: Object as () => {
        color: { active: string; hover: string; status: string }
      },
      // required: true,
      default: () => {
        return {
          color: { active: "#000", hover: "#000", status: "#000" }
        }
      }
    }
  },
  data() {
    return {
      map: null as unknown as L.Map,
      showLayerDialog: false,
      newArea: null as any,
      newFeature: null as any,
      newGeoJSON: null as any,
      layerId: null as any,
    }
  },
  mounted() {
    this.initMap();
  },
  methods: {
    ...mapActions(['setNeighborhood']),
    initMap() {
      this.map = L.map(this.$refs.areaMap as HTMLElement, undefined)
      L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> רינגו נדלן'
      }).addTo(this.map)

      setTimeout(() => {
        this.centerArea(this.area)
      }, 1000)

      this.areaLayer(this.map)

      this.map.pm.addControls({
        position: "bottomleft",
        drawMarker: false,
        drawCircleMarker: false,
        drawPolyline: false, // draw streight line
        drawRectangle: false,
        drawPolygon: true, // draw new shapes
        rotateMode: false, // draw new shapes, temporaly changed
        drawCircle: false,
        editMode: true, // edit shapes
        dragMode: false,
        cutPolygon: false,
        removalMode: false, // erase shapes
        pinningOption: false,
        snappingOption: false,
      })

      this.map.invalidateSize()
    },
    areaLayer(map: L.Map) {
      if ((map as any).areaLayerGroup) {
        map.removeLayer((map as any).areaLayerGroup);
        delete (map as any).cityLayerGroup;
      }

      const getColor = (type: 'active' | 'hover' | 'status') => {
        return this.settings.color[type] || '#000'
      }

      (map as any).areaLayerGroup = new L.LayerGroup();

      ((self) => {
        self.area.FeatureCollection.features.forEach(
          function (feature: any, featureIndex: number) {
            const geometry = JSON.parse(JSON.stringify(feature.geometry));
            self.newFeature = JSON.parse(JSON.stringify(feature));

            (map as any).areaLayerGroup.addLayer(
              L.geoJSON(geometry, {
                style: () => {
                  return { color: getColor('active'), weight: 2, opacity: 0.65 };
                },
                onEachFeature: function (f, layer) {
                  self.layerId = (map as any).areaLayerGroup.getLayerId(layer)

                  self.$watch(
                    function () {
                      return this.settings.color.active;
                    },
                    (n: any) => {
                      (layer as any).setStyle({
                        color: n,
                        weight: 2,
                        opacity: 0.65,
                      })
                    }
                  );
                  // TODO unwatch before destroy

                  layer.on({
                    mouseover: () => {
                      (layer as any).setStyle({
                        color: getColor('hover'),
                        weight: 2,
                        opacity: 0.65,
                      })
                    },
                    mouseout: () => {
                      (layer as any).setStyle({
                        color: getColor('active'),
                        weight: 2,
                        opacity: 0.65,
                      })
                    },
                    preclick: () => {
                      (layer as any).setStyle({
                        color: getColor('status'),
                        weight: 2,
                        opacity: 0.65,
                      })
                    },
                  });

                  layer.on('pm:update', (e) => {
                    const updGeoJSON = JSON.parse(
                      JSON.stringify((e.layer as any).toGeoJSON()))
                    self.editNewFeature(featureIndex,
                      updGeoJSON.geometry.coordinates[0])
                  })

                  map.on('pm:create', (e) => {
                    const { layer } = e;

                    layer.on({
                      mouseover: () => {
                      (layer as any).setStyle({
                        color: getColor("hover"),
                        weight: 2,
                        opacity: 0.65,
                      });
                    },
                    mouseout: () => {
                      (layer as any).setStyle({
                        color: getColor("active"),
                        weight: 2,
                        opacity: 0.65,
                      });
                    },
                    preclick: () => {
                      (layer as any).setStyle({
                        color: getColor("status"),
                        weight: 2,
                        opacity: 0.65,
                      });
                    },
                    })

                    const geoJson = (layer as any).toGeoJSON();
                    self.newArea = {
                      FeatureCollection: {
                        type: 'FeatureCollection',
                        features: [{
                          geometry: {
                            coordinates: [geoJson.geometry.coordinates],
                            type: 'MultiPolygon'
                          },
                          type: 'Feature'
                        }]
                      },
                      name: [{label: '',language: 'he'},{label: '', language: 'en'},{label: '',language: 'ar'}]
                    }
                    self.newGeoJSON = JSON.parse(JSON.stringify(geoJson))
                    map.removeLayer(layer)
                    self.showLayerDialog = true
                  });
                }
              })
            )
          }
        );

        (map as any).areaLayerGroup.addTo(map);
      })(this)
    },
    centerArea(area: any) {
      if (area == null || area == undefined) console.log('Help')
      const cords: L.LatLng[] = area.FeatureCollection.features.reduce(
        (o: L.LatLng[], v: any) => {
          return o.concat(
            v.geometry.coordinates[0][0].map((x: any) =>
              L.GeoJSON.coordsToLatLng(x))
          )
        },
        []
      )

      // Again, force rerender the map tiles
      this.map.invalidateSize();
      (this.map.attributionControl as any)._map.fitBounds(cords);
    },
    editNewFeature(index: number, coordinates: any[]) {
      this.newFeature.geometry
        .coordinates[index] = coordinates

      this.$emit('editFeature', 0, {}, this.newFeature);
    },
    setNewArea() {
      if (this.formIsChanged) {
        const ask = confirm('Previous area is not saved, continue?')
        if (ask) {
          this.setNeighborhood(this.newArea)
          this.$emit('createNewNeighborhood')
          this.showLayerDialog = false
        }
        return;
      }
      this.setNeighborhood(this.newArea)
      this.$emit('createNewNeighborhood')
      this.showLayerDialog = false
    },
    pushNewPolygon() {
      const index = this.newFeature.geometry.coordinates.length
      const getColor = (type: 'active' | 'hover' | 'status') => {
        return this.settings.color[type] || '#000'
      }

      ((self) => {(self.map as any).areaLayerGroup
        .addLayer(L.geoJSON(self.newGeoJSON.geometry, {
          style: () => {
            return { color: getColor('active'), weight: 2, opacity: 0.65 };
          },
          onEachFeature: function (f: any, layer: L.Layer) {
            self.$watch(
              function () {
                return this.settings.color.active;
              },
              (n: any) => {
                (layer as any).setStyle({
                  color: n,
                  weight: 2,
                  opacity: 0.65,
                })
              }
            );
            layer.on({
              mouseover: () => {
                (layer as any).setStyle({
                  color: getColor('hover'),
                  weight: 2,
                  opacity: 0.65,
                })
              },
              mouseout: () => {
                (layer as any).setStyle({
                  color: getColor('active'),
                  weight: 2,
                  opacity: 0.65,
                })
              },
              preclick: () => {
                (layer as any).setStyle({
                  color: getColor('status'),
                  weight: 2,
                  opacity: 0.65,
                })
              },
            });
            layer.on('pm:update', (e) => {
              const featureIndex = index
              const updGeoJSON = JSON.parse(
                JSON.stringify((e.layer as any).toGeoJSON()))
              console.log(updGeoJSON)
              console.log(featureIndex)
              self.editNewFeature(featureIndex,
                updGeoJSON.geometry.coordinates)
            })
          },
        }))
      })(this)

      this.newFeature.geometry.coordinates.push(
        this.newGeoJSON.geometry.coordinates)

      this.$emit('editFeature', 0, {}, this.newFeature);
      this.newArea = null
      this.showLayerDialog = false
    }
  },
  watch: {
    area: function() {
      if (this.dialog) {
        this.areaLayer(this.map)
        this.centerArea(this.area)
      }
    }
  }
})
</script>

<style lang='scss' scoped>
$orange: #ff8900;
$dark: #0e4275;
$success: #3f9967;

.mapWrapper {
  > div.areaMap {
    width: 100%;
    height: 400px;
  }
}
</style>
