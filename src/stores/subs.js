import { defineStore } from "pinia";

export const useSubStore = defineStore({
  id: "subs",
  state: () => ({
    subscribers: [],
  }),
  actions: {
    add(name) {
      this.subscribers.push(name);
    },
    doesntHave(name) {
      return !this.subscribers.includes(name);
    },
  },
  persist: {
    storage: window.sessionStorage,
    paths: ['subscribers'],
  },
});
