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
          <v-col>A</v-col>
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

export default Vue.extend({
  props: {
    neighborhood: null as any,
    city: null as any,
    letleafEvent: null as any,
  },
  data() {
    return {}
  }
})
</script>

<style>

</style>