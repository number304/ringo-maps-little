<template>
  <v-autocomplete
    multiple
    menu-props="closeOnContentClick"
    :items="$store.getters.allCities"
    :item-text="getItemLanguage()"
    return-object
    v-model="selectedCities"
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
        {{ data.item.name.find((x) => x.language == $store.getters["i18n/current"]).label }}
      </v-chip>
    </template>
    <template v-slot:item="{ item }">
      {{ item.name.find((x) => x.language == $store.getters["i18n/current"]).label }}
    </template>
  </v-autocomplete>
</template>

<script lang="ts">
import Vue from "vue";
export default Vue.extend({
  name: "components.selectCity.autocomplete",
  computed: {
    selectedCities: {
      get: function () {
        return this.$store.getters.selectedCities;
      },
      set: function (items: any[]) {
          this.$store.dispatch("cities/selected", {item: items, action: "replace"})
      },
    }
  },
  methods: {
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
    removeCity: function (item: any) {
      this.$store.dispatch("cities/selected", {item, action: "remove"})
    },
  },
  data: function () {
    return {};
  },
});
</script>

<style lang="scss" scoped>
</style>