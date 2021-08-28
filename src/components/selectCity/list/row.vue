<template>
  <v-row>
    <v-col>
      <v-row>
        <v-col cols="2">ID</v-col>
        <v-col
          cols="10"
          @click="copyToClipboard($event, city.id || city._id)"
          >
          {{ city.id || city._id }}
          </v-col
        >
      </v-row>
      <v-row>
        <v-col cols="2">{{ $store.getters["i18n/current"] }}</v-col>
        <v-col cols="10">{{ cityName }}</v-col>
      </v-row>
      <v-row :key="tranIndex" v-for="(trans, tranIndex) in cityTrans">
        <v-col cols="2">{{ trans.language }}</v-col>
        <v-col cols="10">{{ trans.label }}</v-col>
      </v-row>
    </v-col>
    <v-col style="user-select: none">
      <CityMap
        :city="city"
        :cityIndex="index"
        @editNeighborhood="emitModal"
        @fullscreen="$emit('fullscreen', true)"
        @fullscreenOut="$emit('fullscreen', false)"
      />
    </v-col>
  </v-row>
</template>

<script lang="ts">
import Vue from "vue";
export default Vue.extend({
  name: "components.selectedCityList.row",
  components: {
    CityMap: () => import("@/components/CityMap.vue"),
  },
  computed: {
    lang: function () {
      return (this.$store as any).getters["i18n/current"] || "en";
    },
    cityName: function () {
      return this.city.name.find(
        (x: { language: string; label: string }) => x.language == this.lang
      ).label;
    },
    cityTrans: function () {
      return this.city.name.filter(
        (x: { language: string; label: string }) => x.language != this.lang
      );
    },
  },
  props: {
    city: {
      required: true,
      type: Object,
    },
    index: {
      required: true,
      type: Number,
    },
  },
  methods: {
    copyToClipboard: function (e: Event, str: string) {
      const el = document.createElement("textarea");
      el.value = str;
      el.setAttribute("readonly", "");
      el.style.position = "absolute";
      el.style.left = "-9999px";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    },
    emitModal: function () {
      this.$emit('editNeighborhood')
    }
  },
});
</script>

<style>
</style>
