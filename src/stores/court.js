import { defineStore } from "pinia";

export const useCourtStore = defineStore({
  id: "court",
  state: () => ({
    jail: {},
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
    isGuilty(context) {
      return this.jail[context.username];
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
    guilty(name) {
      this.session = false;
      this.accused = "";
      this.guiltyCount = 0;
      this.innocentCount = 0;
      this.jury = {};
      this.jail[name] = true;
    },
    innocent(name) {
      this.session = false;
      this.accused = "";
      this.guiltyCount = 0;
      this.innocentCount = 0;
      this.jury = {};
      delete this.jail[name];
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
    paths: [
      "accused",
      "jail",
      "session",
      "guiltyCount",
      "innocentCount",
      "jury",
    ],
  },
});
