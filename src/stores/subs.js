import { defineStore } from "pinia";

export const useSubStore = defineStore({
  id: "subs",
  state: () => ({
    subscribers: {},
  }),
  actions: {
    add(context) {
      this.subscribers[context.username] = context;
    },
    doesntHave(name) {
      return !Object.keys(this.subscribers).includes(name);
    },
    has(name) {
      return Object.keys(this.subscribers).includes(name);
    },
    getSubscriber(name) {
      return this.subscribers[name];
    },
  },
  persist: {
    storage: window.sessionStorage,
    paths: ["subscribers"],
  },
});
