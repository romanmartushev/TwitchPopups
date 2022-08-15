import { defineStore } from "pinia";

export const useCoolDownStore = defineStore({
  id: "coolDown",
  state: () => ({
    all: {},
    user: {},
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
    },
    removeGlobal(command) {
      return delete this.all[command];
    },
    hasGlobal(command) {
      return Object.prototype.hasOwnProperty.call(this.all, command);
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
      const event = wrapFunction(vm.removeUser, [username, command]);
      this.user[username][command] = setTimeout(event, attributes.userCoolDown);
    },
    removeUser(username, command) {
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
  },
  persist: {
    storage: window.sessionStorage,
    paths: ["coolDown"],
  },
});
