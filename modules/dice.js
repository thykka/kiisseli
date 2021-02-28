class DiceGame {
  constructor(options) {
    const defaults = {
      icons: '` · `|`. ˙`|`.·˙`|`: :`|`:·:`|`:::`'.split('|'),
      minSides: 2,
      maxSides: Number.MAX_SAFE_INTEGER,
      maxDice: 7,
      translations: {
        rollRandom_argTooSmall: 'Number too small',
        rollRandom_argTooBig: 'Number too large',
        rollRandom_malformedNumber: 'Command needs a number',
        rollRandom_result: 'You rolled a',
        rollDice_validRange: 'Number must be within range',
        rollDice_result: 'You rolled:',
        rollDice_total: 'Total'
      },
      commands: {
        rollRandom: ['random'],
        rollDice: ['roll']
      }
    };
    Object.assign(this, defaults, options);
  }

  async initStorage(Storage) {
    this.state = await Storage.getItem('dice_state') || {};
  }

  initEvents(events) {
    Object.entries(this.commands).forEach(([actionName, triggers]) => {
      triggers.forEach(trigger => {
        events.on(`command:${ trigger }`, this[actionName].bind(this));
      });
    });
  }

  rollDice({ command, message }) {
    const count = typeof command.args[0] === 'number' ? command.args[0] : 1;
    if(count < 0 || count > this.maxDice) {
      message.reply(`${
        this.translations.rollDice_validRange
      } 0-${ this.maxDice }`);
      return;
    };
    const dice = Array.from(
      { length: count }, () => this.getSingle()
    );
    const sum = dice.reduce((sum, v) => sum + v, 0);
    console.log(dice,sum);
    message.reply(`${
      this.translations.rollDice_result
    } ${
      dice.map(value => this.formatDie(value)).join(' ')
    }${
      count > 1
        ? ` ${ this.translations.rollDice_total }: ${ sum }` 
        : ''
    }`);
  }

  rollRandom({command, message}) {
    const sides = typeof command.args[0] === 'number' ? command.args[0] : this.icons.length;
    switch (true) {
      case (sides < this.minSides):
        message.reply(this.translations.rollRandom_argTooSmall);
        return;
      case (sides > this.maxSides):
        message.reply(this.translations.rollRandom_argTooBig)
        return;
      case (typeof sides === 'string'):
        message.reply(this.translations.rollRandom_malformedNumber)
        return;
    }
    const value = this.getSingle(sides);
    message.reply(`${
      this.translations.rollRandom_result
    } ${
      sides === this.icons.length
        ? this.formatDie(value)
        : value
    }`);
  }

  getSingle(sides = this.icons.length) {
    if(!sides) return 0;
    return Math.floor(Math.random() * sides + 1);
  }

  formatDie(value) {
    return this.icons[value - 1] ?? '';
  }
}

export default DiceGame;
export { DiceGame };
