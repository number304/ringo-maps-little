<template>
  <div>
    <v-card v-if="!getArea.neighborhood || !getArea.city || !getArea.letleafEvent">
      <v-card-title class="text-h5" style="word-break: normal">
        Please choose a neighborhood to edit!
      </v-card-title>
      <v-divider></v-divider>
      <v-btn color="green darken-1" text
        @click.stop="close" class="my-2"
      >
        Exit
      </v-btn>
    </v-card>
    <v-card v-else>
      <v-card-title class="text-h5" style="word-break: normal">
        {{ getArea.city.name[1].label }} - {{ neighborhoodLabel }}
      </v-card-title>
      <v-divider></v-divider>

      <v-container>
        <v-row>
          <v-col>
            <v-text-field
              v-for="name in form.name"
              :key="name.language"
              :label="formLabel(name.language)"
              v-model="name.label"
              class="mx-4"
            ></v-text-field>
            <div class="d-flex mx-4 mb-4">
              <label for="activeColor">
                Active Color
              </label>
              <v-spacer></v-spacer>
              <input
                type="color"
                name="activeColor"
                v-model="form.color.active"
              >
            </div>
            <div class="d-flex mx-4 mb-4">
              <label for="hoverColor">
                Hover Color
              </label>
              <v-spacer></v-spacer>
              <input
                type="color"
                name="hoverColor"
                v-model="form.color.hover"
              >
            </div>
            <div class="d-flex mx-4">
              <label for="statusColor">
                Status Color
              </label>
              <v-spacer></v-spacer>
              <input
                type="color"
                name="statusColor"
                v-model="form.color.status"
              >
            </div>
            <div class="px-4 pb-4 pt-2 text-left select-to-merge">
              <v-select
                :items="getCollidingNBs"
                item-text="name[1].label"
                :disabled="getCollidingNBs.length === 0"
                :label="selectToMergeLabel"
                return-object
                v-model="nbSelectedToMerge"
              ></v-select>
              <div class="d-flex justify-center">
                <v-btn
                  :disabled="nbSelectedToMerge === null"
                  small style="color: white"
                  color="orange darken-2"
                  @click.stop="mergeSelectedNb"
                >
                  Merge
                </v-btn>
              </div>
            </div>
          </v-col>
          <v-col>
            <AreaMap
              :area="getArea"
              :key="areaMapKey"
              :settings="{ color: form.color }"
              :dialog="dialog"
              :formIsChanged="isChanged"
              @createNewNeighborhood="reloadModal"
              @editFeature="layerChanges"
              @restauredArea="restauredArea"
            />
          </v-col>
        </v-row>
      </v-container>

      <v-divider></v-divider>
      <v-card-actions>
        <p class="mb-0 ml-2 text-body-2">
          Form has {{ isChanged ? '' : 'not' }} changed.
        </p>
        <v-spacer></v-spacer>
        <v-btn color="green darken-1" text
          @click.stop="newArea"
          :disabled="!hasName || !isChanged"
        >
          Save
        </v-btn>

        <v-btn color="green darken-1" text
          @click.stop="close"
        >
          Cancel
        </v-btn>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import AreaMap from './AreaMap.vue'
import { mapGetters, mapActions } from 'vuex'

import dissolve from '@turf/dissolve'
import { featureCollection, polygon } from '@turf/helpers'

import { nanoid } from 'nanoid';

interface InitForm {
  name: { language: string, label: null }[];
  color: {
    active: null | string;
    hover: null | string;
    status: null | string;
  }
  mapTouched: boolean;
  mapData: null;
}

export default Vue.extend({
  components: {
    AreaMap,
  },
  props: {
    dialog: {
      type: Boolean,
      required: true,
    }
  },
  data() {
    return {
      form: null as any,
      nbColors: { active: '#e3a702', hover: '#571414', status: '#55915c' },
      touchedOldArea: false,
      nbSelectedToMerge: null as any,
    };
  },
  created() {
    if (this.getArea.neighborhood.color) this.nbColors = this.getArea.neighborhood.color

    if (this.getArea) this.form = this.initForm()
  },
  beforeUpdate() {
    if (this.getArea.neighborhood && !this.dialog) {
      this.reloadModal()
      this.touchedOldArea = true
    }
    if (this.isNewArea) {
      this.reloadModal()
      this.touchedOldArea = false
    }
  },
  computed: {
    ...mapGetters(['getArea', 'getCollidingNBs']),
    areaMapKey(): string {
      return this.getArea.neighborhood.id ||
        this.getArea.neighborhood._id ||
        nanoid(24)
    },
    isChanged() {
      if (!this.getArea.neighborhood) return;

      let check = false;
      const data = JSON.parse(JSON.stringify(this.form.name));
      for (let i = 0; i < this.getArea.neighborhood.name.length; i++) {
        const ref = data.find(
          (x: any) => x.language == this.getArea.neighborhood.name[i].language
        );
        if (ref) ref.label = JSON.parse(JSON.stringify(this.getArea.neighborhood.name[i])).label;
      }

      if(JSON.stringify(data) != JSON.stringify(this.form.name)) check = true;
      if (this.form.color.active != this.nbColors.active) check = true;
      if (this.form.color.hover != this.nbColors.hover) check = true;
      if (this.form.color.status != this.nbColors.status) check = true;
      if (this.form.mapTouched) check = true;
      return check;
    },
    hasName(): boolean {
      return this.form.name[0].label.length > 0
      && this.form.name[1].label.length > 0
      || this.form.name[1].label.length > 0
      && this.form.name[2].label.length > 0 ? true : false
    },
    isNewArea(): boolean {
      return this.getArea.neighborhood
        && !(this.getArea.neighborhood.id || this.getArea.neighborhood._id)
        && this.touchedOldArea
    },
    neighborhoodLabel(): string {
      if (this.form.name[1].label.length === 0) return 'New neighborhood'
      else return this.form.name[1].label
    },
    selectToMergeLabel(): string {
      return this.getCollidingNBs.length === 0 ? 'No neighborhoods colliding' : 'Select a neighborhood to merge'
    }
  },
  methods: {
    close() {
      if (this.isChanged) {
        const ask = confirm('Are you sure to exit?');
        if (ask) {
          this.$emit('closeModal');
          this.setNeighborhood(this.getArea.neighborhood);
          this.form.color.active = this.nbColors.active;
          this.form.color.hover = this.nbColors.hover;
          this.form.color.status = this.nbColors.status;
          this.restauredArea();
          this.cleanCollidingNBs();
          this.nbSelectedToMerge = null;
        }
        return;
      }
      this.$emit('closeModal');
      this.cleanCollidingNBs();
      this.nbSelectedToMerge = null;
    },
    mergeSelectedNb() {
      // Necessary cause dissolve doesn't work with MultiPolygons
      const selectedPolygons = this.nbSelectedToMerge.FeatureCollection
        .features[0].geometry.coordinates.reduce(
          (total: any[], pol: any[]) => {
            total.push(polygon(pol))
            return total
          }, []
        )

      const polType = this.getArea.neighborhood.FeatureCollection
        .features[0].geometry.type

      let areaPolygons
      if (!this.form.mapData) {
        if (polType === 'Polygon') areaPolygons = [this.getArea.neighborhood.FeatureCollection.features[0]]
        else areaPolygons = this.getArea.neighborhood.FeatureCollection
          .features[0].geometry.coordinates.reduce(
            (total: any[], pol: any[]) => {
              total.push(polygon(pol))
              return total
            }, []
          )
      }
      else {
        if (polType === 'Polygon') areaPolygons = [this.form.mapData[2]]
        else areaPolygons = this.form.mapData[2].geometry.coordinates.reduce(
              (total: any[], pol: any[]) => {
                total.push(polygon(pol))
                return total
              }, []
            )
      }

      const features: any = featureCollection([...areaPolygons, ...selectedPolygons])
      // console.log(features)
      const dissolved = dissolve(features)
      // console.log(dissolved)

      let IDsToErase

      if (this.getArea.neighborhood.id) IDsToErase = [this.getArea.neighborhood.id, this.nbSelectedToMerge.id]
      else IDsToErase = [...this.getArea.neighborhood.IDsToErase, this.nbSelectedToMerge.id]

      const newNeighborhood = {
        'FeatureCollection': dissolved,
        'name': [{label: '',language: 'he'},{label: '', language: 'en'},{label: '',language: 'ar'}],
        IDsToErase
      }

      console.log(newNeighborhood)

      this.setArea([{}, newNeighborhood, this.getArea.city])
      this.reloadModal()
    },
    // Just to set the names in form object by argument's name property
    setNeighborhood(neighborhood: any) {
      // console.log(neighborhood)
      const data = JSON.parse(JSON.stringify(this.form.name));
      for (let i = 0; i < neighborhood.name.length; i++) {
        const ref = data.find(
          (x: any) => x.language == neighborhood.name[i].language
        );
        if (ref) ref.label =JSON.parse(JSON.stringify(neighborhood.name[i])).label;
      }
      this.$set(this.form, 'name', data);
    },
    layerChanges(index: number, feature: any, geoJSON: any) {
      this.form.mapData = [index, feature, geoJSON];
      this.form.mapTouched = true;
    },
    reloadModal() {
      console.log('Modal reloading')
      if (this.getArea.neighborhood.color)
        this.nbColors = this.getArea.neighborhood.color
      else this.nbColors = { active: '#e3a702', hover: '#571414', status: '#55915c' }

      this.form = this.initForm()
      this.nbSelectedToMerge = null;
      this.cleanCollidingNBs();
    },
    restauredArea() {
      this.form.mapData = null;
      this.form.mapTouched = false;
    },
    initForm(): InitForm {
      const names = JSON.parse(JSON.stringify(this.getArea.neighborhood.name))

      return {
        name: names,
        color: {
          active: this.nbColors.active,
          hover: this.nbColors.hover,
          status: this.nbColors.status,
        },
        mapTouched: false,
        mapData: null,
      }
    },
    formLabel(language: string): string | any {
      if(!this.form.name) return;
      if(language === 'he') return 'Name in hebrew';
      else if(language === 'en') return 'Name in english';
      else if(language === 'ar') return 'Name in arabic';
      else return 'Name in other language';
    },
    newArea() {
      // If neighborhood don't have id then is new
      if (!(this.getArea.neighborhood.id || this.getArea.neighborhood._id)) {
        if (!this.form.mapTouched) {
          const newNeighborhood = this.getArea.neighborhood.FeatureCollection.features[0]
          this.form.mapData = [0, {}, newNeighborhood]
        }
        this.createArea([this.getArea.city.id || this.getArea.city._id, this.form])
        if (this.getArea.neighborhood.IDsToErase) {
          // Run a function to erase this areas from API
          setTimeout(() => this.deleteNeighborhoods([(this.getArea.city.id || this.getArea.city._id), this.getArea.neighborhood.IDsToErase]), 1000)
        }
      }
      else this.editArea([(this.getArea.city.id || this.getArea.city._id), this.getArea.neighborhood, this.form]);

      this.$emit('closeModal')
    },
    ...mapActions(['editArea', 'createArea', 'deleteNeighborhoods', 'cleanCollidingNBs', 'setArea']),
  },
})
</script>

<style lang="scss" scoped>
  .select-to-merge {
    background-color: rgba($color: whitesmoke, $alpha: 0.75);
    border-radius: 4px;
    margin-top: 8px;
  }
</style>
