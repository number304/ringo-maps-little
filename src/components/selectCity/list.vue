<template>
  <div>
    <CityAutoComplete />

    <v-data-iterator
      :items="$store.getters.selectedCities"
    >
      <template v-slot:header>
        <v-row>
          <v-col
            v-for="header in headers"
            :key="header"
          >
            <p><b>{{ header }}</b></p>
          </v-col>
        </v-row>
      </template>
      <template v-slot:default="props">
        <v-row>
          <v-col
            v-for="(city, index) in props.items"
            :key="index"
            cols="12"
            :style="index % 2 === 0 ? 'background-color: #F2F2F2' : ''"
          >
            <v-row>
              <v-col>
                <p>{{ index + 1 }}</p>
              </v-col>
              <v-col>
                <p>{{ city.name[1].label }}</p>
              </v-col>
              <v-col>
                <p>{{ city.name[0].label }}</p>
              </v-col>
              <v-col>
                <p>{{ city.id }}</p>
              </v-col>
              <v-col style="user-select: none">
                <CityMap
                  :city="city"
                  @editNeighborhood="toggleModalEditNeighborhood"
                />
              </v-col>
            </v-row>
          </v-col>
        </v-row>
      </template>
    </v-data-iterator>
    <v-dialog
      style="z-index: 402" persistent
      v-model="dialog" max-width="800px"
    >
      <EditArea :dialog="dialog" @closeModal="toggleModalEditNeighborhood"/>
    </v-dialog>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { GeoJSON } from 'leaflet';
import { mapGetters, mapActions } from 'vuex';

export default Vue.extend({
  name: 'components.selectedCityList',
  components: {
    CityMap: ()=>import("@/components/CityMap.vue"),
    EditArea: ()=>import("@/components/EditArea.vue"),
    CityAutoComplete: ()=>import("@/components/selectCity/autocomplete.vue")
  },
  data() {
    return {
      headers: ['Index', 'Name', 'Translations', 'Id', 'Map'],
      dialog: false,
    };
  },
  async created() {
    await this.fetchCities();
    this.$store.dispatch("cities/selected", {item: this.allCities.find((x: any)=>(x.id || x._id)=="5f197ceda69db72eb094bce7"), action: 'add'});
  },
  methods: {
    toLatLng(array: Array<number>) {
      return GeoJSON.coordsToLatLng([array[0], array[1]]);
    },
    toggleModalEditNeighborhood() {
      this.dialog = !this.dialog
    },
    ...mapActions(['fetchCities'])
  },
  computed: mapGetters(['allCities'])
});
</script>
