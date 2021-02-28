import Storage  from 'node-persist';
import { EventEmitter } from 'events';
import Discord from 'discord.js';

class Brain {
  constructor(options = {}) {
    const defaults = {
      moduleNames: [],
      moduleOptions: {},
      token: '',
    };
    Object.assign(this, defaults, options);
  }

  async init() {
    this.storage = await Storage.init();
    this.client = new Discord.Client();
    this.initEvents();
    this.modules = await this.loadModules();
    this.events.emit('brain:ready');
    this.client.login(this.token);
  }

  initEvents() {
    this.events = new EventEmitter();
    //this.events.on('brain:ready', () => console.log('brain loaded!'))

    this.client.on('ready', () => {
      this.events.emit('brain:connected');
    });
    this.events.on('brain:connected',
      () => console.log('Connected to Discord')
    );
  }

  async loadModules(modules = this.moduleNames) {
    return Promise.all(modules.map(async moduleName => {
      const m = await import(`./${ moduleName }.js`);
      return new m.default(this.moduleOptions[moduleName]);
    }));
  }
}

export default Brain;
export { Brain };