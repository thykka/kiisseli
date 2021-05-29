import _ from 'lodash';
import Translation from './translation.js';
import Scores from './scores.js';
import { calculatePoints } from '../modules/wordlist-utils.js';
import { weighedRandom } from './weighedRandom.js';

const log = (...args) => console.log(new Date(), ...args);

class KnotGame {
  constructor(options) {
    const defaults = {
      storageKeyPlayers: 'knotPlayers',
      storageKeyGame: 'knotGame',
      commandsNewGame: ['k', 'knot'],
      commandsShowScores: ['kp', 'knot.points'],
      commandsRequestHint: ['kh', 'knot.hint'],
      allowedChannels: ['channel_id_goes_here'],
      translations: {
        newKnotMessage: v => `New knot: ${v.flag} ${v.knot} - [${v.points}]`,
        showKnotMessage: v => `Current knot: ${v.flag} ${v.knot} - [${v.points}] - (${v.hint})`,
        showCurrentPointsMessage: v => `You received ${v.points}, total: ${v.total}`,
        cannotBuyHintMessage: v => `Hint costs ${v.cost}, you only have ${v.points}`,
        boughtHintMessage: v => `${v.player} bought a hint: ${v.hint}`,
        gameActivity: v => `Knot: ${v.knot}`,
        descriptionNewGame: 'Show current word',
        descriptionRequestHint: v => `Reveal a letter's location, costs ${v.cost} points`,
        descriptionShowScores: 'Show hi-scores',
        descriptionNewGameNumArg: 'Start new game with custom word length',
        descriptionNewGameLangArg: 'Start new game with custom language',
        skipKnotMessage: v => `${ v.username } skipped the knot. Answer: ${ v.answer }`,
        cannotAffordSkip: v => `Skipping costs ${ v.cost } points, you only have ${ v.points }`
      },
      rightEmoji: '✅',
      wrongEmoji: '❌',
      flags: {
        en: '🇬🇧',
        fi: '🇫🇮'
      },
      defaultLang: 'en',
      defaultLength: 5,
      maxShuffleAttempts: 500,
      hintCost: 1,
      skipCost: 1,
      lengthProbabilities: [0,1,3,5,3,2,1,1,1,1]
    };
    Object.assign(this, defaults, options);
    (async () => {
      const languages = Object.keys(this.flags);
      this.defaultLang = languages[0];
      this.wordList = await this.initWordList(languages);
      /*
      this.letterOccurrences = Object.fromEntries(
        Object.entries(this.wordList).map(
          ([lang, list]) => [lang, countOccurrences(list)]
        )
      );
      */
    })();
    this.loc = new Translation(this.translations).localize;
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

  async initWordList(languages) {
    // better not touch this...
    const loadLang = async lang => await import(`./wordlist-${lang}.js`).then(m=>m.default);
    let wordLists = await Promise.all(languages.map(l=>loadLang(l)));
    return Object.fromEntries(languages.map((l,i)=>([l,wordLists[i]])));
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
    let newLength = (
      length &&
      length > this.lengthProbabilities.findIndex(p => p > 0)
    ) ? length
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
    const points = calculatePoints(this.wordList[lang], answer);
    this.announceKnot({
      knot: game.knot,
      lang,
      points,
      isNew: true
    });
    this.updateKnotActivity(game);
    return game;
  }

  announceKnot({
    knot = this.game.knot,
    lang = this.game.lang,
    points = calculatePoints(this.wordList[this.game.lang], this.game.answer),
    isNew = false, // new knots don't display the hint
  } = {}) {
    const view = {
      flag: this.flags[lang],
      knot: this.formatLetters(knot),
      points,
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
      //const points = max(1, (this.game.answer.length - 4) * 2);
      const points = calculatePoints(this.wordList[this.game.lang], this.game.answer);
      const { username } = message.author;
      const result = await this.scores.modifyPlayerPoints(username, points);
      message.reply(this.loc('showCurrentPointsMessage', { points, total: result }));
      this.game = await this.createGame();
    } else {
      message.react(this.wrongEmoji);
    }
  }

  async newGame({message, command}) {
    if(!Array.isArray(command.args) || command.args.length === 0) {
      this.announceKnot();
      return;
    }
    await this.purchaseWithPoints({
      message, cost: this.skipCost,
      success: async playerPoints => {
        const lang = command.args.find(
          arg => typeof arg === 'string' &&
            Object.keys(this.wordList).includes(arg)
        );
        const length = command.args.find(
          arg => typeof arg === 'number' &&
          arg > 0
        );
        this.channel.send(this.loc('skipKnotMessage', {
          ...playerPoints,
          answer: this.game.answer
        }));
        this.game = await this.createGame(lang, length);
      },
      fail: playerPoints => {
        message.reply(this.loc('cannotAffordSkip', playerPoints));
      }
    })
  }

  async showScores({message}) {
    const scoresText = await this.scores.getHiscoreList();
    message.channel.send(scoresText);
  }

  async requestHint({message}) {
    await this.purchaseWithPoints({
      message, cost: this.hintCost,
      success: async ({ points, username, cost }) => {
        const hint = this.randomHint();
        this.game.hints = hint;
        await this.storage.setItem(this.storageKeyGame, this.game);

        message.channel.send(this.loc('boughtHintMessage', {
          hint: this.formatLetters(hint),
          cost,
          player: username,
          left: points
        }));
      },
      fail: playerPoints => {
        message.reply(this.loc('cannotBuyHintMessage', playerPoints));
      }
    });
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

  async purchaseWithPoints({message, cost, success, fail}) {
    const { username } = message.author;
    const currentPoints = await this.scores.getPlayerPoints(username);
    if(currentPoints < cost) {
      if(typeof fail === 'function') fail({
        message, points: currentPoints, cost, username
      });
      return;
    }
    const pointsLeft = await this.scores.modifyPlayerPoints(username, -cost);
    if (typeof success === 'function') success({
      message, points: pointsLeft, cost, username
    });
  }
}

export { KnotGame };
export default KnotGame;
