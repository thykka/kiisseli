

class Scores {
  constructor(name, options = {}) {
    const defaults = {};
    Object.assign(this, defaults, options);
    this.name = name;
    this.storage = options.storage;
    this.events = options.events;
  }
  
  initEvents(events) {
    this.events = events;
  }
  
  async initStorage(storage) {
    this.storage = storage;
  }

  async modifyPlayerPoints(playerKey, amount) {
    return await this.setPlayerPoints(
      playerKey,
      await this.getPlayerPoints(playerKey) + amount
    );
  }

  async setPlayerPoints(playerKey, points) {
    const key = this.getKey()
    const storageItem = { ...(
      await this.storage.getItem(key)
    ), [playerKey]: points };
    const result = await this.storage.setItem(key, storageItem);
    return result.content.value[playerKey];
  }

  async getPlayerPoints(playerKey) {
    const saved = await this.storage.getItem(this.getKey());
    return saved && saved[playerKey] || 0;
  }

  getKey() {
    return `HiScores_${ this.name }`;
  }
}

export default Scores;