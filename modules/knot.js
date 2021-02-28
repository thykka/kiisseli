import _ from 'lodash';
import wordList from './knot-words.js';

class KnotGame {
  constructor(options) {
    const defaults = {
      storageKeyPlayers: 'knotPlayers',
      storageKeyGame: 'knotGame',
      commandsNewGame: ['knot', 'knot.new'],
      allowedChannels: ['channel_id_goes_here'],
      newKnotMessage: 'New knot:'
    };
    Object.assign(this, defaults, options);
  }

  async initStorage(storage) {
    this.storage = storage;
    const storedPlayers = await storage.getItem(this.storageKeyPlayers);
    this.players = storedPlayers || [];
    const storedGame = await storage.getItem(this.storageKeyGame);
    this.game = storedGame || this.createGame();
  }

  initEvents(events) {
    events.on('message', this.handleMessage.bind(this));
    this.commandsNewGame.forEach(commandName => {
      events.on(`command:${commandName}`, this.newGame.bind(this));
    });
    events.on('brain:connected', client => {
      //this.client = client;
      this.channel = client.channels.cache.get(this.allowedChannels[0]);
    });
    this.events = events;
  }

  async createGame() {
    const answer = _.sample(wordList).toLowerCase();
    const knot = _.shuffle([...answer]).join('');
    const hints = '_'.repeat(answer.length);
    const game = { answer, knot, hints };
    await this.storage.setItem(this.storageKeyGame, game);
    this.announceKnot(game.knot);
    return game;
  }

  announceKnot(knot) {
    this.channel.send(`${this.newKnotMessage} ${
      [...knot.toUpperCase()].map(l=>'`'+l+'`').join(' ')
    }`);
  }

  handleMessage(message) {
    if(!this.allowedChannels.includes(message.channel.id)) return;
    const word = message.content.split(' ')[0]
    if(!word || !this.hasSameLetters(word)) return;
    this.processGuess(word, message);
  }

  hasSameLetters(word) {
    return word.length === this.game.answer.length &&
      word.toLowerCase().split('').sort().join('') ===
      this.game.answer.split('').sort().join('');
  }

  async processGuess(guess, message) {
    if(guess === this.game.answer) {
      message.react('✅');
      this.game = await this.createGame();
    } else {
      message.react('❌');
    }
  }

  newGame() {
    
  }
}

export { KnotGame };
export default KnotGame;