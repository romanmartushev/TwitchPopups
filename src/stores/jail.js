import { defineStore } from "pinia";

export const useJailStore = defineStore({
  id: "jail",
  state: () => ({
    cells: {},
  }),
  actions: {
    guilty(name) {
      this.cells[name] = true;
    },
    innocent(name) {
      this.cells[name] = false;
    },
    isGuilty(context) {
      return this.cells[context.username];
    },
    isInnocent(context) {
      return !this.cells[context.username];
    },
  },
  persist: {
    storage: window.sessionStorage,
    paths: ["cells"],
  },
});
