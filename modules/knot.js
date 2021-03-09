import _ from 'lodash';
import wordList from './knot-words.js';

import wordListFinnish from '../wordgame-words-big.js';
import Scores from './scores.js';

import { weighedRandom } from './weighedRandom.js';

const log = (...args) => console.log(new Date(), ...args);
const { max } = Math;

class KnotGame {
  constructor(options) {
    const defaults = {
      storageKeyPlayers: 'knotPlayers',
      storageKeyGame: 'knotGame',
      commandsNewGame: ['k', 'knot'],
      commandsShowScores: ['kp', 'knot.points'],
      commandsRequestHint: ['kh', 'knot.hint'],
      allowedChannels: ['channel_id_goes_here'],
      newKnotMessage: f => `New knot: ${ f.flag } ${ f.knot }`,
      showKnotMessage: f => `Current knot: ${ f.flag } ${ f.knot } (${ f.hint })`,
      announcePointsNewMessage: 'Points:',
      announcePointsTotalMessage: 'Total:',
      descriptionNewGame: 'Show current word',
      descriptionRequestHint: `Reveal a letter's location`,
      descriptionShowScores: 'Show hi-scores',
      descriptionNewGameNumArg: 'Start new game with custom word length',
      descriptionNewGameLangArg: 'Start new game with custom language',
      gameActivity: f => `Knot: ${ f.knot }`,
      rightEmoji: '✅',
      wrongEmoji: '❌',
      wordList: {
        en: wordList,
        fi: wordListFinnish
      },
      flags: {
        en: '🇬🇧',
        fi: '🇫🇮'
      },
      defaultLang: 'en',
      defaultLength: 5,
      maxShuffleAttempts: 500,
      hintCost: 1,
      cannotBuyHintMessage: f => `Not enough points to buy hint (${f.points}/${f.cost})`,
      boughtHintMessage: f => `${f.player} paid ${f.cost} points for a hint: ${f.hint}`,
      lengthProbabilities: [0,1,3,5,3,2,1,1,1,1]
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

  listCommands() {
    return [
      {
        command: this.commandsNewGame[0],
        description: this.loc('descriptionNewGame'),
        args: [
          {
            command: `${this.commandsNewGame[0]} <${1}-${this.lengthProbabilities.length}>`,
            description: this.loc('descriptionNewGameNumArg')
          },{
            command: `${this.commandsNewGame[0]} <${Object.keys(this.wordList).join('/')}>`,
            description: this.loc('descriptionNewGameLangArg')
          }
        ]
      },{
        command: this.commandsRequestHint[0],
        description: this.loc('descriptionRequestHint', { cost: this.hintCost })
      },{
        command: this.commandsShowScores[0],
        description: this.loc('descriptionShowScores')
      }
    ]
  }

  async initGame() {
    const storedGame = await this.storage.getItem(this.storageKeyGame);
    this.game = storedGame || await this.createGame(this.defaultLang, this.defaultLength);
    this.updateKnotActivity();
  }

  updateKnotActivity(currentGame = this.game) {
    this.events.emit('brain:requestPresence', {
      activityText: this.loc('gameActivity', { knot: currentGame.knot.toUpperCase() })
    });
  }

  async createGame(lang = this.game.lang, length) {
    let newLength = (length && length > 0) ? length
      : weighedRandom(this.lengthProbabilities) + 1;
    const list = (
      this.wordList[lang] ||
      this.wordList[this.defaultLang]
    ).filter(word => word.length === newLength);
    if(!list.length) {
      this.channel.send('Nope.');
      return this.createGame(lang, this.defaultLength);
    }
    const answer = _.sample(list).toLowerCase();
    let knot = answer;
    let tries = 0;
    do {
      knot = _.shuffle([...answer]).join('');
      tries++;
    } while(knot === answer && tries <= this.maxShuffleAttempts)
    const hints = '_'.repeat(answer.length);
    const game = { answer, knot, hints, lang, length: answer.length };
    await this.storage.setItem(this.storageKeyGame, game);
    log(_.omit(game, ['answer']));
    this.announceKnot(game.knot, lang, true);
    this.updateKnotActivity(game);
    return game;
  }

  announceKnot(knot = this.game.knot, lang = this.game.lang, isNew = false) {
    const view = {
      flag: this.flags[lang],
      knot: this.formatLetters(knot),
      hint: this.game.hints === '_'.repeat(this.game.hints.length)
        ? null
        : this.formatLetters(this.game.hints)
    };
    this.channel.send(
      this.loc(isNew ? 'newKnotMessage' : 'showKnotMessage', view)
    );
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
      message.react(this.rightEmoji);
      const points = max(1, (this.game.answer.length - 4) * 2);
      const { username } = message.author;
      const result = await this.scores.modifyPlayerPoints(username, points);
      log({ player: username, points });
      message.reply(this.loc('showCurrentPointsMessage', { points, total: result }));
      this.game = await this.createGame();
    } else {
      message.react(this.wrongEmoji);
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
      arg > 0
    );
    this.game = await this.createGame(lang, length);
  }

  async showScores({message}) {
    const scoresText = await this.scores.getHiscoreList();
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