

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

  async getHiscoreList() {
    const scores = await this.storage.getItem(this.getKey());
    const maxNameLength = Object.keys(scores)
      .reduce((acc, name) => Math.max(acc, name.length), 0);
    return `Hi-Scores (${ this.name })\n\`\`\`\n${
      Object.entries(scores)
      .sort((a, b) => b[1] - a[1])
      .map(([player, points]) => `${ player.padEnd(maxNameLength, ' ') }: ${ points }`)
      .join('\n')
    }\`\`\``;
  }
}

export default Scores;