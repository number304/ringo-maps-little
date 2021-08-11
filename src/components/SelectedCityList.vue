<template>
  <div>

    <v-autocomplete multiple :items="allCities" v-model="selectedCities" :filter="filterCities">
      <template v-slot:selection="data">
                <v-chip
                  v-bind="data.attrs"
                  :input-value="data.selected"
                  close
                  @click="data.select"
                  @click:close="removeCity(data.item)"
                >

                 {{data.item.name.find(x=>x.language=='en').label}}
                </v-chip>
              </template>
      <template v-slot:item="{item}">
        {{item.name.find(x=>x.language=='en').label}}
      </template>
    </v-autocomplete>

    <v-data-iterator
      :items="selectedCities"
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
import CityMap from './CityMap.vue';
import EditArea from './EditArea.vue';
import { mapGetters, mapActions } from 'vuex';

export default Vue.extend({
  name: 'components.selectedCityList',
  components: {
    CityMap,
    EditArea,
  },
  data() {
    return {
      headers: ['Index', 'Name', 'Translations', 'Id', 'Map'],
      dialog: false,
      selectedCities: []
    };
  },
  async created() {
    await this.fetchCities();
    this.selectedCities = (JSON.parse(JSON.stringify((this.allCities || []) ))).filter((x: any)=>["5f197ceda69db72eb094bce7"].indexOf(x.id)!=-1)
  },
  methods: {
    toLatLng(array: Array<number>) {
      return GeoJSON.coordsToLatLng([array[0], array[1]]);
    },
    toggleModalEditNeighborhood() {
      this.dialog = !this.dialog
    },
    filterCities: function(item: any, queryText: string){
      const match = new RegExp(queryText, 'ig');
      return !!item.name.filter((x:any)=>x.label.match(match)).length;
    },
    removeCity: function(city: any){
      const index = this.selectedCities.findIndex((x: any)=>x._id==city._id);
      if(index > -1) this.selectedCities.splice(index, 1);
    },
    ...mapActions(['fetchCities'])
  },
  computed: mapGetters(['allCities'])
});
</script>
