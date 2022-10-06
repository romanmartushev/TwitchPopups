import { defineStore } from "pinia";

export const useCoolDownStore = defineStore({
  id: "coolDown",
  state: () => ({
    all: {},
    user: {},
    allTimer: {},
    userTimer: {},
  }),
  actions: {
    addGlobal(command, attributes) {
      const vm = this;
      const wrapFunction = function (fn, params) {
        return async function () {
          await fn.apply(null, params);
        };
      };
      const event = wrapFunction(vm.removeGlobal, [command]);
      this.all[command] = setTimeout(event, attributes.globalCoolDown);
      this.allTimer[command] = new Date().getTime();
    },
    removeGlobal(command) {
      delete this.allTimer[command];
      return delete this.all[command];
    },
    hasGlobal(command) {
      return Object.prototype.hasOwnProperty.call(this.all, command);
    },
    getGlobalTime(command, time) {
      return Math.floor(
        (time - (new Date().getTime() - this.allTimer[command])) / 1000
      );
    },
    addUser(command, attributes, username) {
      const vm = this;
      const wrapFunction = function (fn, params) {
        return async function () {
          await fn.apply(null, params);
        };
      };
      if (!Object.prototype.hasOwnProperty.call(this.user, username)) {
        this.user[username] = {};
      }
      if (!Object.prototype.hasOwnProperty.call(this.userTimer, username)) {
        this.userTimer[username] = {};
      }
      const event = wrapFunction(vm.removeUser, [username, command]);
      this.user[username][command] = setTimeout(event, attributes.userCoolDown);
      this.userTimer[username][command] = new Date().getTime();
    },
    removeUser(username, command) {
      delete this.userTimer[username][command];
      return delete this.user[username][command];
    },
    hasUser(username, command) {
      if (Object.prototype.hasOwnProperty.call(this.user, username)) {
        return Object.prototype.hasOwnProperty.call(
          this.user[username],
          command
        );
      }
      return false;
    },
    getUserTime(username, command, time) {
      return Math.floor(
        (time - (new Date().getTime() - this.userTimer[username][command])) /
          1000
      );
    },
  },
  persist: {
    storage: window.sessionStorage,
    paths: ["all", "user", "allTimer", "userTimer"],
  },
});
