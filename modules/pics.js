import fetch from 'node-fetch';
import Translation from './translation.js';

class Pics {
  constructor(options) {
    const defaults = {
      commands: {
        getPicture: ['picture']
      },
      translations: {
        getPictureDescription: 'Get a random cat picture'
      },
      pictureApiUrl: 'https://api.thecatapi.com/v1/images/search'
    }
    Object.assign(this, defaults, options);
    this.loc = new Translation(this.translations).localize;
  }

  initEvents(events) {
    Object.entries(this.commands).forEach(([actionName, triggers]) => {
      triggers.forEach(trigger => {
        events.on(`command:${ trigger }`, this[actionName].bind(this));
      });
    });
  }

  getPicture({ message, command }) {
    fetch(this.pictureApiUrl)
      .then(res=>res.json())
      .then(res=>{
        if(!Array.isArray(res) || !res.length) return;
        const { url } = res[0];
        if(!url) return;
        message.channel.send(url);
      });
  }

  listCommands() {
    return [
      {
        command: `${this.commands.getPicture[0]}`,
        description: this.loc('getPictureDescription')
      }
    ]
  }
}

export default Pics;