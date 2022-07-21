import { defineStore } from "pinia";

export const useVipStore = defineStore({
  id: "vips",
  state: () => ({
    vips: {},
  }),
  actions: {
    add(context) {
      this.vips[context.username] = context;
    },
    has(name) {
      return Object.keys(this.vips).includes(name);
    },
    getVip(name) {
      return this.vips[name];
    },
  },
  persist: {
    storage: window.sessionStorage,
    paths: ["vips"],
  },
});
