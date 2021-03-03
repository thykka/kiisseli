import _ from 'lodash';
import wordList from './knot-words.js';

import wordListFinnish from '../wordgame-words-big.js';

class KnotGame {
  constructor(options) {
    const defaults = {
      storageKeyPlayers: 'knotPlayers',
      storageKeyGame: 'knotGame',
      commandsNewGame: ['knot', 'knot.new'],
      allowedChannels: ['channel_id_goes_here'],
      newKnotMessage: 'New knot:',
      wordList: {
        en: wordList,
        fi: wordListFinnish
      },
      defaultLang: 'en',
      minLength: 3,
      defaultLength: 5
    };
    Object.assign(this, defaults, options);
    this.defaultLang = Object.keys(this.wordList)[0];
  }

  async initStorage(storage) {
    this.storage = storage;
    const storedPlayers = await storage.getItem(this.storageKeyPlayers);
    this.players = storedPlayers || [];
    const storedGame = await storage.getItem(this.storageKeyGame);
    this.game = storedGame ||this.createGame(this.defaultLang, this.defaultLength);
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

  async createGame(lang = this.game.lastLang, length = this.game.lastLength) {
    let list = this.wordList[lang];
    if(length && length >= this.minLength) {
      list = list.filter(word => word.length === length);
    }
    const answer = _.sample(list).toLowerCase();
    const knot = _.shuffle([...answer]).join('');
    const hints = '_'.repeat(answer.length);
    const game = { answer, knot, hints, lastLang: lang, lastLength: answer.length };
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
    const word = message.content.split(/\s/)[0];
    if(!word || !this.hasSameLetters(word)) return;
    this.processGuess(word, message);
  }

  hasSameLetters(word) {
    console.log(word, this.game.answer);
    return word.length === this.game.answer.length &&
      word.toLowerCase().split('').sort().join('') ===
      this.game.answer.toLowerCase().split('').sort().join('');
  }

  async processGuess(guess, message) {
    if(guess === this.game.answer) {
      message.react('✅');
      this.game = await this.createGame();
    } else {
      message.react('❌');
    }
  }

  async newGame({command}) {
    if(Array.isArray(command.args) && command.args.length) {
      const lang = command.args.find(arg => typeof arg === 'string' && ['en', 'fi'].includes(arg));
      const length = command.args.find(arg => typeof arg === 'number');
      this.game = await this.createGame(lang, length);
    } else {
      this.game = await this.createGame();
    }
  }
}

export { KnotGame };
export default KnotGame;