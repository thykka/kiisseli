import Translation from './translation.js';

class Custard {
  constructor(defs, opts) {
    Object.assign(this, defs, opts);
    if(this.translations) {
      this.loc = new Translation(this.translations).localize;
    }
    if(this.useClient) {
      this.initClient = this._initClient;
    }
    if(this.useStorage) {
      this.initStorage = this._initStorage;
    }
    if(this.useEvents) {
      this.initEvents = this._initEvents;
    }
    if(this.commands) {
      this.initEvents = this._initCommandEvents;
    }
  }

  _initClient(client) {
    this.client = client;
  }
  
  _initStorage(storage) {
    this.storage = storage;
  }

  _initEvents(events) {
    this.events = events;
  }

  _initCommandEvents(events) {
    this.events = events;
    (this.initCommands || this._initCommands).bind(this)();
  }

  _initCommands() {
    Object.entries(this.commands).forEach(([actionName, triggers]) => {
      triggers.forEach(trigger => {
        this.events.on(`command:${ trigger }`, this[actionName].bind(this));
      });
    });
    this.listCommands = this.listCommands || this._listCommands;
  }
  
  _listCommands() {
    return Object.entries(this.commands).map(([command, triggers]) => ({
      command: triggers[0],
      description: this.loc(`description_${command}`)
    }));
  }
}

export default Custard;
export { Custard };