import Storage  from 'node-persist';
import { EventEmitter } from 'events';
import Discord from 'discord.js';

class Brain {
  
  /**
   * @param {Object} config - 
   * @param {String} config.token - Your Discord Bot Token
   * @param {Boolean} [config.autoConnect] - Set to `true` to connect after instantiation
   * @param {String} [config.commandPrefix] - Only messages starting with this will trigger modules
   * @param {Array} [config.modules] - Modules to load
   */
  constructor(token, config) {
    const defaults = {
      commandPrefix: 'brain',
      commandsDescription: 'Available commands:',
      commandsSelfDescription: 'Shows available commands',
      token
    };
    Object.assign(this, defaults, config);
    this.init().then(() => {
      if(config.autoConnect) this.start();
    });
  }

  async init() {
    this.events = new EventEmitter();
    this.storage = await Storage.init();
    this.client = new Discord.Client();
    this.initEvents();
    this._modules = await this.loadModules(this.modules);
    this.events.emit('brain:ready');
    console.log('brain initialized');
  }

  start() {
    this.client.login(this.token);
  }

  initEvents() {
    this.client.on('ready', () => {
      console.log('Connected to Discord');
      this.events.emit('brain:connected', this.client);
    });
    this.client.on('message', this.processMessage.bind(this));
    this.events.on('brain:requestPresence', (...args) => this.requestPresence(...args));

    this.events.on('command:?', ev => this.listCommands(ev));
  }

  async requestPresence(options) {
    const settings = {
      status: 'online'
    };
    settings.activity = options.activityText ? {
      type: 'PLAYING',
      name: options.activityText || options || ''
    } : {};
    await this.client.user.setPresence(settings);
  }

  async loadModules(modules) {
    return Promise.all(modules.map(config => this.loadModule(config)));
  }

  async loadModule(config = {}) {
    const { name, file } = config;
    const module = await import(file || `./${ name }.js`);
    const instance = new module.default({...config, name});
    this.initModuleStorage(instance);
    this.initModuleEvents(instance);
    this.initModuleClient(instance);
    return instance;
  }

  initModuleClient(instance) {
    if(typeof instance.initClient !== 'function') return;
    instance.initClient(this.client);
  }

  initModuleEvents(instance) {
    if(typeof instance.initEvents !== 'function') return;
    instance.initEvents(this.events);
  }

  initModuleStorage(instance) {
    if(typeof instance.initStorage !== 'function') return;
    instance.initStorage(Storage);
  }

  listCommands({message}) {
    const helpCommandText = this.formatCommand({
      command: '?',
      description: this.commandsSelfDescription
    });
    const commandsText = this._modules
      .flatMap(mod => typeof mod.listCommands === 'function'
        ? mod.listCommands().map(result => `${ this.formatCommand(result) }`)
        : false)
      .filter(text => text !== false)
      .sort()
      .join('\n');
    message.reply(`${ this.commandsDescription }\n${ helpCommandText }\n${ commandsText }`);
  }

  formatCommand({command, description, args}) {
    const argCommands = Array.isArray(args)
      ? '\n\t' + args.map(argCommand => this.formatCommand(argCommand)).join('\n\t')
      : '';
    return `\`${this.commandPrefix}${command}\` - ${description}${ argCommands }`
  }


  processMessage(message) {
    if(message.author.equals(this.client.user)) return;
    const command = this.extractCommand(message);
    if(command && command.name) {
      this.events.emit(`command:${command.name}`, {command, message});
    } else {
      this.events.emit(`message`, message);
    }
  }
  
  extractCommand(message) {
    const { content } = message;
    if(typeof content !== 'string' || !content.length) return;
    if(!content.startsWith(this.commandPrefix)) return;
    const [ name, ...args ] = content.substring(this.commandPrefix.length)
      .trim().split(/\s/g)
      .filter(arg=>arg)
      .map(arg => this.stringToIntMaybe(arg));
    return { name: (name || '').toLowerCase(), args };
  }

  stringToIntMaybe(arg) {
    if(typeof arg !== 'string') return;
    const int = parseInt(arg);
    return !Number.isNaN(int) && int.toString() === arg ? int : arg;
  }
}

export default Brain;
export { Brain };
