export default class Reacts {
  constructor(options) {
    const defaults = {
      reactions: [
        ['Hello, World', '🌐'], // [message part to match, emoji to react with]
        [/Hello, World/, '🌍']
      ]
    };
    Object.assign(this, defaults, options);
  }
  
  initEvents(events) {
    events.on('message', this.handleMessage.bind(this));
  }

  handleMessage(message) {
    this.reactions.forEach(([trigger, emoji]) => {
      const regex = typeof trigger === 'string'
        ? new RegExp(`\\b${trigger}\\b`)
        : trigger;
      if(message.content.match(regex)) {
        message.react(emoji)
      }
    })
  }
}
