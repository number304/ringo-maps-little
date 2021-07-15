<template>
  <div>
    <v-card v-if="!neighborhood || !city || !letleafEvent">
      <v-card-title class="text-h5" style="word-break: normal">
        Please choose a neighborhood to edit!
      </v-card-title>
    </v-card>
    <v-card v-else>
      <v-card-title class="text-h5" style="word-break: normal">
        {{ city.name[1].label }} - {{ neighborhood.name[1].label }}
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
          </v-col>
          <v-col>A</v-col>
        </v-row>
      </v-container>

      <v-divider></v-divider>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="green darken-1" text
          @click.stop="$emit('closeModal')"
        >
          Save
        </v-btn>

        <v-btn color="green darken-1" text
          @click.stop="$emit('closeModal')"
        >
          Cancel
        </v-btn>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

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
  props: ['letleafEvent', 'neighborhood', 'city'],
  data() {
    const form = (this as any).initForm();
    return {
      form,
    };
  },
  computed: {
    isChanged() {
      if (!this.neighborhood) return;

      let check = false;
      const data = JSON.parse(JSON.stringify(this.form.name));
      for (let i = 0; i < this.neighborhood.name.length; i++) {
        const ref = data.find(
          (x: any) => x.language == this.neighborhood.name[i].language
        );
        if (ref) ref.label = JSON.parse(JSON.stringify(this.neighborhood.name[i])).label;
      }

      if(JSON.stringify(data) != JSON.stringify(this.form.name)) check = true;
      if (this.form.color.active != "#e3a702") check = true;
      if (this.form.color.hover != "#571414") check = true;
      if (this.form.color.status != "#55915c") check = true;
      if (this.form.mapTouched) check = true;
      return check;
    }
  },
  methods: {
    // Just to set the names in form object by argument's name property
    setNeighborhood(neighborhood: any) {
      const data = JSON.parse(JSON.stringify(this.form.name));
      for (let i = 0; i < neighborhood.name.length; i++) {
        const ref = data.find(
          (x: any) => x.language == neighborhood.name[i].language
        );
        if (ref) ref.label =JSON.parse(JSON.stringify(neighborhood.name[i])).label;
      }
      this.$set(this.form, 'name', data);
    },
    initForm(): InitForm {
      const names = JSON.parse(JSON.stringify(this.neighborhood.name))

      return {
        name: names,
        color: {
          active: '#e3a702',
          hover: '#571414',
          status: '#55915c',
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
    }
  },
  watch: {
    neighborhood: {
      handler: function (newVal) {
        this.setNeighborhood(newVal);
      },
    },
  },
})
</script>

<style>

</style>