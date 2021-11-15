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
    this.events = events;
    Object.entries(this.commands).forEach(([actionName, triggers]) => {
      triggers.forEach(trigger => {
        events.on(`command:${ trigger }`, this[actionName].bind(this));
      });
    });
  }

  async startGame({message, command}) {
    // new round
    if(!this.game) {
      this.createGame({
        channel: message.channel,
        smalls: command.args.length ? +(command.args[0]) : null
      });
      this.updatePresence();
      this.lastStartMessage = await message.channel.send([
        `**${ message.author.username } started a new numbers game**`,
        this.infoLine(this.game, this.intervalSeconds)
      ].join('\n'));
      this.lastStartMessage.pin();
      this.restartTimer();
    } else {
      message.reply(`Numbers game already started. Type \`.${
        this.commands.registerAnswer[0]
      } [equation]\` to send your solution`);
    }
  }

  createGame({channel, smalls}) {
    if(!this.channel) this.channel = channel;
    const gameSettings = {};
    if(smalls) gameSettings.split = smalls;
    this.game = new NumbersGame(gameSettings);
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
      `solution ${
        this.formatNumber(expression + ' = ' + result)
      } missed target by ${
        this.formatNumber((isPositive ? '+' : '-') + difference)
      }.`
    ];
    if(!best || best.difference > difference) {
      this.restartTimer();
      reply.push(`**${
        player
      } took first place!** Time extended ⏳ ${
        this.formatNumber(this.intervalSeconds)
      }s`)
    }
    message.reply(reply.join('\n'));
  }

  handleTimerTriggered() {
    if(!this.channel) return;
    this.stopTimers();
    this.lastStartMessage?.unpin();
    this.updatePresence('😴');
    const bestAnswer = this.game.getBestAnswer();
    const messages = ['**Round over!**'];
    if(!bestAnswer) {
      messages.push('Nobody played a valid answer')
    } else {
      if(
        Math.abs(bestAnswer.difference) <= Math.pow(2, -52)
      ) {
        messages.push(`**${
          bestAnswer.player
        } wins the round** with a perfect answer: `);
      } else {
        messages.push(`**${
          bestAnswer.player
        } wins the round** missing the target by ${
          this.formatNumber(bestAnswer.difference)
        }: `)
      }
      messages.push(
        this.formatNumber(`${ bestAnswer.expression } = ${ bestAnswer.result }`)
      );
    }
    this.channel.send(messages.join(' '));
    this.game = false;
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

  formatNumber(number) {
    return '`' + number + '`';
  }

  getRemainingTime() {
    if(!this.game) return '-';
    const elapsedSeconds = Math.round((Date.now() - this.gameStarted) / 1000);
    return this.intervalSeconds - elapsedSeconds;
  }

  infoLine(game, remainingTime) {
    return `🎯 ${
      this.formatNumber(game.targetNumber)
    } 🔢 ${
      this.formattedNumbers()
    } ⏳ ${
      this.formatNumber(remainingTime || this.getRemainingTime())
    }s`;
  }

  formattedNumbers() {
    if(!this.game) return '(n/a)';
    return this.game.numbers.map(n => this.formatNumber(n)).join(', ');
  }

  updatePresence(presenceText) {
    this.events.emit('brain:requestPresence', {
      activityText: presenceText || this.getPresenceText()
    });
  }

  getPresenceText() {
    return `${this.game.targetNumber} / ${this.game.numbers.join('·')}`;
  }

  handleNotify() {
    this.channel.send(this.infoLine(this.game));
  }
}

export default Numbers;