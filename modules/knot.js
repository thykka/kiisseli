import _ from 'lodash';
import wordList from './knot-words.js';

import wordListFinnish from '../wordgame-words-big.js';

const { log } = console;

class KnotGame {
  constructor(options) {
    const defaults = {
      storageKeyPlayers: 'knotPlayers',
      storageKeyGame: 'knotGame',
      commandsNewGame: ['k', 'knot'],
      allowedChannels: ['channel_id_goes_here'],
      newKnotMessage: 'New knot',
      showKnotMessage: 'Current knot',
      wordList: {
        en: wordList,
        fi: wordListFinnish,
        _debug: ['aaaaa']
      },
      flags: {
        en: '🇬🇧',
        fi: '🇫🇮',
        _debug: '🐛'
      },
      defaultLang: 'en',
      defaultLength: 5,
      minLength: 3,
      maxShuffleAttempts: 50
    };
    Object.assign(this, defaults, options);
    this.defaultLang = Object.keys(this.wordList)[0];
  }

  initStorage(storage) {
    this.storage = storage;
  }

  initEvents(events) {
    events.on('message', this.handleMessage.bind(this));
    this.commandsNewGame.forEach(commandName => {
      events.on(`command:${commandName}`, this.newGame.bind(this));
    });
    events.on('brain:connected', client => {
      this.channel = client.channels.cache.get(this.allowedChannels[0]);
      this.initGame()
    });
    this.events = events;
  }

  async initGame() {
    const storedPlayers = await this.storage.getItem(this.storageKeyPlayers);
    this.players = storedPlayers || [];
    const storedGame = await this.storage.getItem(this.storageKeyGame);
    log(new Date(), _.omit(storedGame, ['answer']));
    this.game = storedGame ||this.createGame(this.defaultLang, this.defaultLength);
  }

  async createGame(lang = this.game.lang, length = this.game.length) {
    let list = this.wordList[lang];
    if(length && length >= this.minLength) {
      list = list.filter(word => word.length === length);
    }
    const answer = _.sample(list).toLowerCase();
    let knot = answer;
    let tries = 0;
    do {
      knot = _.shuffle([...answer]).join('');
      tries++;
    } while(knot === answer && tries > this.maxShuffleAttempts)
    const hints = '_'.repeat(answer.length);
    const game = { answer, knot, hints, lang, length: answer.length };
    await this.storage.setItem(this.storageKeyGame, game);
    this.announceKnot(game.knot, lang, true);
    return game;
  }

  announceKnot(knot = this.game.knot, lang = this.game.lang, isNew = false) {
    this.channel.send(`${
      isNew ? this.newKnotMessage : this.showKnotMessage
    } ${
      this.flags[lang]
    } ${
      [...knot.toUpperCase()].map(l=>'`'+l+'`').join(' ')
    }`);
  }

  handleMessage(message) {
    if(!this.allowedChannels.includes(message.channel.id)) return;
    const word = message.content.split(/\s/)[0];
    if(!word || !this.hasCorrectLetters(word)) return;
    this.processGuess(word, message);
  }

  hasCorrectLetters(word) {
    return word.length === this.game.answer.length &&
      word.toLowerCase().split('').sort().join('') ===
      this.game.answer.toLowerCase().split('').sort().join('');
  }

  async processGuess(guess, message) {
    if(guess.toLowerCase() === this.game.answer) {
      message.react('✅');
      this.game = await this.createGame();
    } else {
      message.react('❌');
    }
  }

  async newGame({command}) {
    if(!Array.isArray(command.args) || command.args.length === 0) {
      this.announceKnot();
      return;
    }
    const lang = command.args.find(
      arg => typeof arg === 'string' &&
        Object.keys(this.wordList).includes(arg)
    );
    const length = command.args.find(
      arg => typeof arg === 'number' &&
      arg >= this.minLength
    );
    this.game = await this.createGame(lang, length);
  }
}

export { KnotGame };
export default KnotGame;