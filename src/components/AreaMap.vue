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
        Redraw layer
      </v-btn>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import "@geoman-io/leaflet-geoman-free";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";

export default Vue.extend({
  props: {
    area: {
      type: Object,
      required: true,
    },
    cancel: {
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
    }
  },
  mounted() {
    this.initMap();
  },
  methods: {
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
            // console.log(geometry);

            (map as any).areaLayerGroup.addLayer(
              L.geoJSON(geometry, {
                style: () => {
                  return { color: getColor('active'), weight: 2, opacity: 0.65 };
                },
                onEachFeature: function (f, layer) {
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
                    self.$emit(
                      'editFeature',
                      featureIndex,
                      feature,
                      JSON.parse(JSON
                        .stringify((e.layer as any).toGeoJSON()))
                    )
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
                    const redraw = () => {
                      layer.remove();
                      self.areaLayer(self.map)
                    }
                    self.$emit('newLayer', geoJson, redraw)
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
      if (area == null || area == undefined) console.log('Ayuda')
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
    }
  },
  watch: {
    cancel: function() {
      if (this.cancel) {
        this.areaLayer(this.map)
        this.$emit('restaureCancel')
      }
      return;
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
