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
      const { compliment } = r;
      const targetIds = command.args
        .map(arg => {
          let match = arg.match(/<@!(\d+)>/) || arg.match(/@?(.+)/);
          return match && match.length > 1 && match[1];
        }).filter(Boolean);
      if(!targetIds.length) {
        message.reply(`${compliment} 🥰`);
        return;
      }
      targetIds.forEach(targetId => {
        const foundUser = this.client.users.cache
          .find(user => [user.id, user.username].includes(targetId));
        if(!foundUser) return;
        
        foundUser.send(`${compliment} 😻`);
        console.log(new Date(), {
          complimentFrom: message.author.username,
          args: command.args
        });
      });
    });
  }
}

export default Compliment;