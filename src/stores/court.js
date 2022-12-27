import { defineStore } from "pinia";

export const useCourtStore = defineStore({
  id: "court",
  state: () => ({
    session: false,
    accused: "",
    guiltyCount: 0,
    innocentCount: 0,
    jury: {},
  }),
  actions: {
    inSession(value = undefined) {
      if (value === undefined) {
        return this.session;
      }
      this.session = value;
    },
    setAccused(name) {
      this.accused = name;
    },
    getAccused() {
      return this.accused;
    },
    guiltyCountAdd() {
      this.guiltyCount++;
    },
    getGuiltyCount() {
      return this.guiltyCount;
    },
    innocentCountAdd() {
      this.innocentCount++;
    },
    getInnocentCount() {
      return this.innocentCount;
    },
    end() {
      this.session = false;
      this.accused = "";
      this.guiltyCount = 0;
      this.innocentCount = 0;
    },
    juryAdd(context) {
      this.jury[context.username] = context;
    },
    voted(context) {
      return Object.keys(this.jury).includes(context.username);
    },
    getVerdict() {
      return this.guiltyCount >= this.innocentCount ? "guilty" : "innocent";
    },
  },
  persist: {
    storage: window.sessionStorage,
    paths: ["accused", "session", "guiltyCount", "innocentCount", "jury"],
  },
});
