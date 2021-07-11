import NumbersGame from './numbersgame.js';

class Numbers {
  constructor(options) {
    const defaults = {
      commands: {
        startGame: ['numbers'],
        registerAnswer: ['=']
      },
      intervalSeconds: 5 * 60,
      notifyIntervalSeconds: 60
    }
    Object.assign(this, defaults, options);
  }

  initEvents(events) {
    Object.entries(this.commands).forEach(([actionName, triggers]) => {
      triggers.forEach(trigger => {
        events.on(`command:${ trigger }`, this[actionName].bind(this));
      });
    });
  }

  startGame({message, command}) {
    const player = message.author.username;
    // new round
    if(!this.game) {
      this.createGame({
        channel: message.channel,
        smalls: command.args.length ? +(command.args[0]) : null
      });
      const formattedTarget = this.formatNumber(this.game.targetNumber);
      const formattedNumbers = this.game.numbers.map(n => this.formatNumber(n)).join(', ');
      message.channel.send([
        `${ player } started a new numbers game!`,
        `Target: ${ formattedTarget }`,
        `Numbers: ${ formattedNumbers }`,
        `${ this.formatNumber(this.intervalSeconds) }s left to submit the first answer.`
      ].join('\n'));
      this.restartTimer();
    } else {
      message.reply(`Numbers game already started. Type \`.${ this.commands.registerAnswer[0] } [equation]\` to attempt`);
    }
  }

  registerAnswer({message, command}) {
    if(!this.game) {
      message.reply(`no numbers game in progress. Type \`.${ this.commands.startGame[0] }\` to begin a new round.`);
      return;
    }
    const player = message.author.username;
    const added = this.game.addAnswer(player, command.args.join(' '));
    if(!added) {
      message.reply(`that's not a valid answer`);
      return;
    }
    const { expression, result, difference } = added;
    if(difference <= Math.pow(2, -52)) {
      this.handleTimerTriggered();
      return;
    }
    message.reply([
      `your solution (${
        this.formatNumber(expression + ' = ' + result)
      }) is off target by ${ this.formatNumber(difference) }`,
      `time extended, ${
        this.formatNumber(this.intervalSeconds)
      }s left to submit answers.`
    ].join('\n'));
    this.restartTimer();
  }

  restartTimer() {
    this.gameStarted = Date.now();
    this.stopTimers();

    this.timerID = setTimeout(() => {
      this.timerID = false;
      this.handleTimerTriggered();
    }, this.intervalSeconds * 1000);

    if(this.intervalSeconds > this.notifyIntervalSeconds) {
      this.notifyID = setInterval(() => {
        this.handleNotify();
      }, this.notifyIntervalSeconds * 1000);
    }
  }

  stopTimers() {
    if(this.timerID) {
      clearTimeout(this.timerID);
      this.timerID = null;
    }
    if(this.notifyID) {
      clearInterval(this.notifyID);
      this.notifyID = null;
    }
  }

  handleNotify() {
    const now = Date.now();
    const elapsedSeconds = Math.round((now - this.gameStarted) / 1000);
    this.channel.send(`Time left: ${ this.intervalSeconds - elapsedSeconds }s`)
  }

  handleTimerTriggered() {
    if(!this.channel) return;
    this.stopTimers();
    const bestAnswer = this.game.getBestAnswer();
    const messages = ['Round over!'];
    if(!bestAnswer) {
      messages.push('Nobody played a valid answer...')
    } else {
      if(
        Math.abs(bestAnswer.difference) <= Math.pow(2, -52)
      ) {
        messages.push(`${
          bestAnswer.player
        } wins the round with a perfect answer:`);
      } else {
        messages.push(`${
          bestAnswer.player
        } wins the round, missing the target by ${
          bestAnswer.difference
        }:`)
      }
      messages.push(
        this.formatNumber(`${ bestAnswer.expression } = ${ bestAnswer.result }`)
      );
    }
    this.channel.send(messages.join('\n'));
    this.game = false;
  }

  formatNumber(number) {
    return '`' + number + '`';
  }

  createGame({channel, smalls}) {
    if(!this.channel) this.channel = channel;
    const gameSettings = {};
    if(smalls) gameSettings.split = smalls;
    this.game = new NumbersGame(gameSettings);
    console.log(this.game)
  }
}

export default Numbers;