class BotModule {
  constructor(moduleDefaults = {}, moduleOptions = {}) {
    const defaults = {
      title: 'Unnamed module',
      triggers: []
    };
    Object.assign(this, defaults, moduleDefaults, moduleOptions);
  }
}

export { BotModule };
export default BotModule;