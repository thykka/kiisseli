import _ from 'lodash';
import expressionparser from 'expressionparser';
const { init: initExpression, formula } = expressionparser;
const parser = initExpression(formula);

const allowedOps = '+-*/'.split``;
const Numbers = {
  small: [1,2,3,4,5,6,7,8,9],
  big: [10,15,20,25,30,35,40,45,50,55,60,65,70,75,80,85,90,95,100]
}

class NumbersGame {
  constructor(options) {
    const defaults = {
      numbersCount: 6,
      split: 4
    }
    Object.assign(this, defaults, options);
    this.targetNumber = Math.floor(Math.random() * 1000);
    this.numbers = this.generateNumbers();
    this.players = [];
  }

  generateNumbers() {
    const smallCount = Math.max(0, Math.min(this.split, this.numbersCount));
    const largeCount = this.numbersCount - smallCount;
    const smalls = this.deal(Numbers.small, smallCount);
    const larges = this.deal(Numbers.big, largeCount);
    return [...smalls, ...larges].sort((a, b) => a - b);
  }

  deal(deck, amount) {
    const hand = [];
    for(let i = 0; i < amount; i++) {
      const card = _.sample(deck);
      if(!hand.some(dealt => dealt === card)) {
        hand.push(card);
      } else {
        i--;
      }
    }
    return hand;
  }

  addAnswer(playerName, answer) {
    if(!this.isValidAnswer(answer)) return;
    const player = this.addPlayer(playerName);
    if(!player) return;
    const newAnswer = this.formatAnswer(answer);
    player.answers.push(newAnswer);
    player.answers = player.answers.sort((a, b) => {
      return a.difference - b.difference
    });
    return newAnswer;
  }

  isValidAnswer(answer) {
    try {
      // ensure the expression can be parsed
      const rpn = parser.expressionToRpn(answer);

      // ensure the expression contains no forbidden operators
      if(rpn.some(op => !this.isAllowedOp(op))) return false;

      // ensure the expression uses only available numbers
      // and that an available number isn't used twice
      const numbers = rpn.filter(op => !Number.isNaN(+op));
      let available = [...this.numbers];
      for(let i = 0; i < numbers.length; i++) {
        const subject = +(numbers[i]);
        if(available.includes(subject)) {
          available = available.filter(availNum => availNum != subject);
        } else {
          return false;
        }
      }
    } catch(e) {
      console.log(answer, 'threw an error', e.message, e.stack);
      return false;
    }
    return true;
  }

  isAllowedOp(op) {
    return (!Number.isNaN(+op) || allowedOps.includes(op));
  }

  addPlayer(name) {
    const foundPlayer = this.players.find(player => player.name === name);
    if(foundPlayer) return foundPlayer;
    const player = { name, answers: [] };
    this.players.push(player);
    return player;
  }

  formatAnswer(answer) {
    return {
      expression: answer,
      result: this.getResult(answer),
      difference: this.getDiff(answer)
    };
  }

  getDiff(answer) {
    return Math.abs(this.targetNumber - this.getResult(answer));
  }

  getResult(answer) {
    return parser.expressionToValue(answer);
  }

  getBestAnswer() {
    if(this.players.length === 0) return false;

    const topPlayers = this.players.sort((a, b) => {
      return a.answers[0].difference - b.answers[0].difference;
    });

    return {
      player: topPlayers[0].name,
      ...topPlayers[0].answers[0]
    };
  }

  sortAsc(arr) {
    return arr.sort((a, b) => a - b);
  }
}

export default NumbersGame;
export { NumbersGame };