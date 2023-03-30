class CooldownStore {
  constructor() {
    this.globalQueue = {};
    this.userQueue = {};
  }

  hasGlobal(command) {
    return Object.prototype.hasOwnProperty.call(this.globalQueue, command);
  }

  hasUser(username, command) {
    if (Object.prototype.hasOwnProperty.call(this.userQueue, username)) {
      return Object.prototype.hasOwnProperty.call(
        this.userQueue[username],
        command
      );
    }
    return false;
  }

  addGlobal(command, attributes) {
    const vm = this;
    const wrapFunction = function (fn, params) {
      return async function () {
        await fn.apply(null, params);
      };
    };
    const event = wrapFunction(vm.removeGlobal, [command, vm]);
    this.globalQueue[command] = setTimeout(event, attributes.globalCoolDown);
  }

  addUser(command, attributes, username) {
    const vm = this;
    const wrapFunction = function (fn, params) {
      return async function () {
        await fn.apply(null, params);
      };
    };
    if (!Object.prototype.hasOwnProperty.call(this.userQueue, username)) {
      this.userQueue[username] = {};
    }
    const event = wrapFunction(vm.removeUser, [username, command, vm]);
    this.userQueue[username][command] = setTimeout(event, attributes.userCoolDown);
  }

  removeGlobal(command, vm) {
    return delete vm.globalQueue[command];
  }

  removeUser(username, command, vm) {
    return delete vm.userQueue[username][command];
  }
}
