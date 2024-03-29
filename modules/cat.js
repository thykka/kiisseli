import Scores from './scores.js';
import MsToHuman from './ms-to-human.js';

export default class Cat  {
  constructor(options) {
    const defaults = {
      channelId: 'channel_id_here',
      interval: 1000 * 60 * 60 * 24,
      appearMessages: [
        '🐈 -meow'
      ],
      scoresCommand: 'meow',
      actions: [
        {
          trigger: 'pet',
          success: 'The cat purrs. You have petted',
          failure: 'The cat ignores you, try again.',
          invalid: 'What are you doing? There\'s no cat...',
          difficulty: 0.5
        }
      ],
      statusMessage: v => `${v.successCount} cat${v.successCount>1?'s':''}. Cat had to wait for ${v.reactionTime}`,
      msFormatter: MsToHuman
    };
    Object.assign(this, defaults, options);
    this.boundAppear = this.appear.bind(this);
  }

  initStorage(storage) {
    this.storage = storage;
    this.scores = new Scores(this.name, {
      storage: this.storage
    });
  }

  initEvents(events) {
    this.events = events;
    this.events.on('brain:connected', client => {
      this.channel = client.channels.cache.get(this.channelId);
      this.initGame();
    });
    this.events.on('command:' + this.scoresCommand, this.showScores.bind(this));
    this.events.on('message', this.handleMessage.bind(this));
  }

  initGame() {
    this.appearTime = false;
    const interval = this.interval * Math.random();
    console.log(`Cat incoming: ${ this.msFormatter(interval) }`);
    this.timeoutId = setTimeout(this.boundAppear, interval);
  }

  handleMessage(message) {
    if(this.channelId !== message.channel.id) return;
    const firstWord = `${ message.content.split(' ').shift() }`.toLowerCase();
    const action = this.actions.find(action => action.trigger === firstWord);
    if(!action) return;
    this.performAction({ action, message });
  }

  createTimeout(fn, interval = this.interval, reset) {
    if(this.timeoutId) {
      if(reset) {
        clearTimeout(this.timeoutId);
      } else {
        return;
      }
    }
    this.timeoutId = setTimeout(fn, interval);
  }

  appear() {
    this.appearTime = Date.now();
    this.channel.send(
      this.appearMessages[
        Math.floor(Math.random() * this.appearMessages.length)
      ]
    );
  }

  async performAction({ action, message }) {
    if(!this.appearTime) {
      message.reply(action.invalid);
      return;
    }
    const success = Math.random() >= action.difficulty;
    if(success) {
      const { username } = message.author;
      const successCount = await this.scores.modifyPlayerPoints(
        `${username}-${action.trigger}`, 1
      );
      const reactionTime = (Date.now() - this.appearTime);
      const status = this.statusMessage({
        reactionTime: this.msFormatter(reactionTime),
        successCount
      });
      const result = `${action.success} ${status}`;
      message.reply(result);
      this.initGame(true);
    } else {
      message.reply(action.failure);
    }
  }
  
  async showScores({message}) {
    const scoresText = await this.scores.getHiscoreList();
    message.channel.send(scoresText);
  }
}
