import fetch from 'node-fetch';
import Custard from './custard.js';

class Compliment extends Custard {
  constructor(options) {
    super({
      commands: {
        compliment: ['compliment', 'c']
      },
      translations: {
        description_compliment: 'Request a compliment'
      },
      useClient: true,
      apiUrl: 'https://complimentr.com/api'
    }, options);
  }

  compliment({ message, command }) {

    fetch(this.apiUrl).then(r=>r.json()).then(r=>{
      const targetIds = command.args
        .map(arg => {
          const match = arg.match(/<@!(\d+)>/);
          return match && match.length > 1 && match[1];
        }).filter(Boolean);
      if(!targetIds.length) {
        message.reply(r.compliment);
        return;
      }
      targetIds.forEach(targetId => {
        const foundUser = this.client.users.cache
          .find(user => user.id === targetId);
        if(!foundUser) return;
        console.log(foundUser);
        foundUser.send(`${r.compliment} 😻`);
      });
    });
  }
}

export default Compliment;