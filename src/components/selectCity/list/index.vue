<template>
  <div :class="{ fullScreen: mapFullscreen, page: true }">
    <CityAutoComplete class="CityAutoComplete" />

    <v-data-iterator :items="$store.getters.selectedCities">
      <template v-slot:header>
        <v-row>
          <v-col v-for="header in headers" :key="header">
            <p>
              <b>{{ header }}</b>
            </p>
          </v-col>
        </v-row>
      </template>
      <template v-slot:default="props">
        <v-row class="tblRows">
          <v-col v-for="(city, index) in props.items" :key="index" cols="12">
            <Row
              :city="city"
              :index="index"
              @editNeighborhood="toggleModalEditArea"
              @fullscreen="mapFullscreen = $event"
            />
          </v-col>
        </v-row>
      </template>
    </v-data-iterator>
    <v-dialog
      style="z-index: 402"
      persistent
      v-model="dialog"
      max-width="800px"
    >
      <EditArea
        :askExpandCity="askExpandCity"
        :dialog="dialog"
        @closeModal="toggleModalEditArea" />
    </v-dialog>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { GeoJSON } from "leaflet";
import { mapGetters, mapActions } from "vuex";

export default Vue.extend({
  name: "components.selectedCityList",
  components: {
    EditArea: () => import("@/components/EditArea.vue"),
    CityAutoComplete: () => import("@/components/selectCity/autocomplete.vue"),
    Row: () => import("@/components/selectCity/list/row.vue"),
  },
  data() {
    return {
      askExpandCity: false,
      dialog: false,
      headers: ["Details", "Map"],
      mapFullscreen: false,
    };
  },
  async created() {
    await this.fetchCities();
    await this.$store.dispatch("cities/selected", {
      item: this.allCities.find(
        (x: any) => (x.id || x._id) == "5f197ceda69db72eb094bce7"
      ),
      action: "add",
    });
  },
  methods: {
    toLatLng(array: Array<number>) {
      return GeoJSON.coordsToLatLng([array[0], array[1]]);
    },
    toggleModalEditArea(notFullyContained?: boolean) {
      if (notFullyContained) this.askExpandCity = true;
      else this.askExpandCity = false;
      this.dialog = !this.dialog;
    },
    ...mapActions(["fetchCities"]),
  },
  computed: mapGetters(["allCities"]),
});
</script>
<style lang="scss" scoped>
div.page {
  .CityAutoComplete {
    z-index: 403;
  }
  &.fullScreen {
    .CityAutoComplete {
      z-index: 0;
    }
  }
}

.row {
  &.tblRows {
    > div {
      &:nth-child(even) {
        background-color: #f2f2f2;
      }
      &:nth-child(odd) {
        background-color: transparent;
      }
    }
  }
}
</style>
