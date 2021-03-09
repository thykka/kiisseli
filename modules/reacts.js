export default class Reacts {
  constructor(options) {
    const defaults = {

    };
    Object.assign(this, defaults, options);
  }
  
  initEvents(events) {
    events.on('message', this.handleMessage.bind(this));
  }

  handleMessage({message}) {
    console.log(message);
  }
}