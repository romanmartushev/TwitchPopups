class Court {
  constructor() {
    this.session = false;
    this.accused = "";
    this.guiltyCount = 0;
    this.innocentCount = 0;
    this.jury = {};
  }

  inSession(value = undefined) {
    if (value === undefined) {
      return this.session;
    }
    this.session = value;
  }

  setAccused(name) {
    this.accused = name;
  }

  getAccused() {
    return this.accused;
  }

  guiltyCountAdd() {
    this.guiltyCount++;
  }

  getGuiltyCount() {
    return this.guiltyCount;
  }

  innocentCountAdd() {
    this.innocentCount++;
  }

  getInnocentCount() {
    return this.innocentCount;
  }

  end() {
    this.session = false;
    this.accused = "";
    this.guiltyCount = 0;
    this.innocentCount = 0;
    this.jury = {};
  }

  juryAdd(context) {
    this.jury[context.username] = context;
  }

  voted(context) {
    return Object.keys(this.jury).includes(context.username);
  }

  getVerdict() {
    return this.guiltyCount >= this.innocentCount ? "guilty" : "innocent";
  }
}
