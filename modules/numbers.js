import NumbersGame from './numbersgame.js';

class Numbers {
  constructor(options) {
    const defaults = {
      commands: {
        startGame: ['numbers'],
        registerAnswer: ['=']
      },
      intervalSeconds: 5 * 60,
      notifyIntervalSeconds: 4 * 60
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
    // new round
    if(!this.game) {
      this.createGame({
        channel: message.channel,
        smalls: command.args.length ? +(command.args[0]) : null
      });
      message.channel.send([
        `${ message.author.username } started a new numbers game with ${
          this.formatNumber(this.intervalSeconds)
        }s countdown:`,
        `Target: 🎯${ this.formatNumber(this.game.targetNumber) }`,
        `Numbers: ${ this.formattedNumbers() }`,
      ].join('\n'));
      this.restartTimer();
    } else {
      message.reply(`Numbers game already started. Type \`.${ this.commands.registerAnswer[0] } [equation]\` to attempt`);
    }
  }

  formattedNumbers() {
    if(!this.game) return '(n/a)';
    return this.game.numbers.map(n => this.formatNumber(n)).join(', ');
  }

  registerAnswer({message, command}) {
    if(!this.game) {
      message.reply(
        `no numbers game in progress. Type \`.${
          this.commands.startGame[0]
        }\` to begin a new round.`
      );
      return;
    }
    const player = message.author.username;
    const best = this.game.getBestAnswer();
    const added = this.game.addAnswer(player, command.args.join(' '));
    if(!added) {
      message.react('❌');
      return;
    }
    const { expression, result, difference } = added;
    if(difference <= Math.pow(2, -52)) {
      message.react('🎯');
      this.handleTimerTriggered();
      return;
    }
    const isPositive = result - this.game.targetNumber > 0;
    const reply = [
      `your solution (${
        this.formatNumber(expression + ' = ' + result)
      }) is off target (🎯${
        this.formatNumber(this.game.targetNumber)
      }) by ${
        this.formatNumber((isPositive ? '+' : '-') + difference)
      }`
    ];
    console.log(best)
    if(!best || best.difference > difference) {
      this.restartTimer();
      message.react('🥇');
      reply.push(`${ player } took first place!`);
      reply.push(`time extended, ${
        this.formatNumber(this.intervalSeconds)
      }s left to submit answers.`)
    } else {
      message.react('✅');
      reply.push(`${ best.player } has first place with ${
        this.formatNumber(best.result)
      }`);
    }
    message.reply(reply.join('\n'));
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
    this.channel.send(`Time left: ${
      this.formatNumber(this.intervalSeconds - elapsedSeconds)
    }s - Target: 🎯${
      this.formatNumber(this.game.targetNumber)
    } - Numbers: ${ this.formattedNumbers() }`);
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
        } wins the round, missing the target (🎯${
          this.formatNumber(this.game.targetNumber)
        }) by ${
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
  }
}

export default Numbers;