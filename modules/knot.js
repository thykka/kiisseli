import _ from 'lodash';
import wordList from './knot-words.js';

import wordListFinnish from '../wordgame-words-big.js';
import Scores from './scores.js';

const log = (...args) => console.log(...args);
const { random, min, max } = Math;
class KnotGame {
  constructor(options) {
    const defaults = {
      storageKeyPlayers: 'knotPlayers',
      storageKeyGame: 'knotGame',
      commandsNewGame: ['k', 'knot'],
      commandsShowScores: ['kp', 'knot.points'],
      commandsRequestHint: ['kh', 'knot.hint'],
      allowedChannels: ['channel_id_goes_here'],
      newKnotMessage: 'New knot',
      showKnotMessage: 'Current knot',
      announcePointsNewMessage: 'Points:',
      announcePointsTotalMessage: 'Total:',
      gameActivity: f => `Knot: ${ f.knot }`,
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
      maxLength: 10,
      maxShuffleAttempts: 50,
      hintCost: 1,
      cannotBuyHintMessage: f => `Not enough points to buy hint (${f.points}/${f.cost})`,
      boughtHintMessage: f => `${f.player} paid ${f.cost} points for a hint: ${f.hint}`
    };
    Object.assign(this, defaults, options);
    this.defaultLang = Object.keys(this.wordList)[0];
  }

  loc(id, view) {
    const foundTranslation = this[id];
    switch (typeof foundTranslation) {
      case 'string':
        return foundTranslation;
      case 'function':
        return foundTranslation(view);
      default:
        return `{${id}}`;
    }
  }

  initStorage(storage) {
    this.storage = storage;
    this.scores = new Scores(this.name, {
      storage: this.storage
    });
  }

  initEvents(events) {
    this.events = events;
    this.events.on('message', this.handleMessage.bind(this));

    this._initCommandEvents(this.commandsNewGame, this.newGame);
    this._initCommandEvents(this.commandsShowScores, this.showScores);
    this._initCommandEvents(this.commandsRequestHint, this.requestHint);

    events.on('brain:connected', client => {
      this.channel = client.channels.cache.get(this.allowedChannels[0]);
      this.initGame();
    });
  }

  _initCommandEvents(commands, handler) {
    if(typeof handler !== 'function' || !Array.isArray(commands)) return;
    const fn = handler.bind(this);
    commands.forEach(name => this.events.on(`command:${name}`, fn))
  }

  async initGame() {
    const storedPlayers = await this.storage.getItem(this.storageKeyPlayers);
    this.players = storedPlayers || [];
    const storedGame = await this.storage.getItem(this.storageKeyGame);
    console.log(_.omit(storedGame, ['answer']));
    this.game = storedGame || await this.createGame(this.defaultLang, this.defaultLength);
    this.updateKnotActivity();
  }

  updateKnotActivity() {
    this.events.emit('brain:requestPresence', {
      activityText: this.loc('gameActivity', { knot: this.game.knot.toUpperCase() })
    });
  }

  nudgeLength(length) {
    let newLength = length;
    if(random() < 0.5) {
      const rnd = random();
      switch(true) {
        case rnd<0.25:
          newLength -= 2;
          break;
        case rnd<0.50:
          newLength -= 1;
          break;
        case rnd<0.75:
          newLength += 1;
          break;
        default:
          newLength += 2;
      }
      newLength = max(this.minLength, min(newLength, this.maxLength));
    }
    return newLength;
  }

  async createGame(lang = this.game.lang, length) {
    const newLength = (
      length && length >= this.minLength
    ) ? length
      : this.nudgeLength(this.game.length);
    const list = (
      this.wordList[lang] ||
      this.wordList[this.defaultLang]
    ).filter(word => word.length === newLength);
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
    log(new Date(), _.omit(this.game, ['answer']));
    this.announceKnot(game.knot, lang, true);
    this.updateKnotActivity();
    return game;
  }

  announceKnot(knot = this.game.knot, lang = this.game.lang, isNew = false) {
    this.channel.send(`${
      isNew ? this.newKnotMessage : this.showKnotMessage
    } ${
      this.flags[lang]
    } ${
      this.formatLetters(knot)
    }`);
  }

  formatLetters(letters) {
    return [...letters.toUpperCase()].map(l=>'`'+l+'`').join(' ');
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
      const points = Math.max(1, (this.game.answer.length - 4) * 2);
      const { username } = message.author;
      const result = await this.scores.modifyPlayerPoints(username, points);
      message.reply(`${
        this.announcePointsNewMessage
      } ${ points } ${ this.announcePointsTotalMessage } ${ result }`);
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

  async showScores({message}) {
    const scoresText = await this.scores.getHiscoreList();
    log(scoresText);
    message.channel.send(scoresText);
  }

  async requestHint({message}) {
    const { username } = message.author;
    const currentPoints = await this.scores.getPlayerPoints(username);
    if(currentPoints < this.hintCost) {
      message.reply(this.loc('cannotBuyHintMessage', {
        cost: this.hintCost,
        points: currentPoints
      }));
      return;
    }
    const pointsLeft = await this.scores.modifyPlayerPoints(username, -this.hintCost);
    const hint = this.randomHint();
    this.game.hints = hint;
    await this.storage.setItem(this.storageKeyGame, this.game);
    message.channel.send(this.loc('boughtHintMessage', {
      player: username,
      cost: this.hintCost,
      left: pointsLeft,
      hint: this.formatLetters(hint)
    }));
  }

  randomHint() {
    const hiddenIndexes = [...this.game.hints].reduce((acc, letter, index) => {
      if(letter === '_') return [...acc, index];
      return acc;
    },[]);
    const revealIndex = _.sample(hiddenIndexes);
    return [...this.game.hints].map((letter, index) => {
      return index === revealIndex ? this.game.answer[revealIndex] : letter
    }).join('');
  }

  formatHint(hint) {
    return [...hint].map(l => `\`${l}\` `).join('');
  }
}

export { KnotGame };
export default KnotGame;