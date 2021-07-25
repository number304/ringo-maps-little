<template>
  <div>
    <v-card v-if="!getArea.neighborhood || !getArea.city || !getArea.letleafEvent">
      <v-card-title class="text-h5" style="word-break: normal">
        Please choose a neighborhood to edit!
      </v-card-title>
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
            <p class="mt-4 mb-0 text-left mx-4">
              Form has {{ isChanged ? '' : 'not' }} changed.
            </p>
          </v-col>
          <v-col>
            <AreaMap
              :area="getArea.neighborhood"
              :key="getArea.neighborhood.id"
              :settings="{ color: form.color }"
              :cancel="cancel"
              @editFeature="layerChanges"
              @restaureCancel="restaureCancel"
              @restauredArea="restauredArea"
            />
          </v-col>
        </v-row>
      </v-container>

      <v-divider></v-divider>
      <v-card-actions>
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
      cancel: false,
      nbColors: { active: '#e3a702', hover: '#571414', status: '#55915c' },
    };
  },
  created() {
    if (this.getArea.neighborhood.color) this.nbColors = this.getArea.neighborhood.color

    if (this.getArea) this.form = this.initForm()
  },
  beforeUpdate() {
    if (!this.dialog) {
      if (this.getArea.neighborhood && this.getArea.neighborhood.color)
        this.nbColors = this.getArea.neighborhood.color
      else this.nbColors = { active: '#e3a702', hover: '#571414', status: '#55915c' }

      this.form = this.initForm()
    }
  },
  computed: {
    ...mapGetters(['getArea']),
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
    neighborhoodLabel(): string {
      if (this.form.name[1].label.length === 0) return 'New neighborhood'
      else return this.form.name[1].label
    },
    hasName(): boolean {
      return this.form.name[0].label.length > 0
      && this.form.name[1].label.length > 0
      || this.form.name[2].label.length > 0 ? true : false
    }
  },
  methods: {
    close() {
      if (this.isChanged) {
        const ask = confirm('Are you sure to exit?');
        if (ask) {
          this.cancel = true;
          this.$emit('closeModal');
          this.setNeighborhood(this.getArea.neighborhood);
          this.form.color.active = this.nbColors.active;
          this.form.color.hover = this.nbColors.hover;
          this.form.color.status = this.nbColors.status;
          this.restauredArea();
        }
        return;
      }
      this.$emit('closeModal');
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
    restauredArea() {
      this.form.mapData = null;
      this.form.mapTouched = false;
    },
    restaureCancel() {
      this.cancel = false
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
      if (!this.getArea.neighborhood.id) {
        if (!this.form.mapTouched) {
          const newNeighborhood = this.getArea.neighborhood.FeatureCollection.features[0]
          this.form.mapData = [0, {}, newNeighborhood]
        }
        this.createArea([this.getArea.city.id, this.form])
      }
      else this.editArea([this.getArea.city.id, this.getArea.neighborhood, this.form]);

      this.$emit('closeModal')
    },
    ...mapActions(['editArea', 'createArea']),
  },
})
</script>
