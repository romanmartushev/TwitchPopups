class EventQueue {
  constructor() {
    this.queue = [];
    this.executing = false;
  }

  isEmpty() {
    return this.queue.length === 0;
  }

  isExecuting() {
    return this.executing;
  }

  add(fn, params) {
    const vm = this;
    const wrapFunction = function(fn, params) {
      return async function() {
        vm.executing = true;
        await fn.apply(null, params);
        vm.executing = false;
      };
    }
    const event = wrapFunction(fn, params);
    this.queue.push(event);
  }

  execute() {
    if (!this.executing && !this.isEmpty()) {
      (this.queue.shift())();
    }
  }
}
