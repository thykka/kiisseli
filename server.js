require('dotenv').config();

const Discord = require('discord.js');
const client = new Discord.Client();

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('message', message => {
  console.log(message)
  if(message.content === 'ping') {
    message.reply('pong');
  }
});

client.login(process.env.TOKEN);

/*
client.generateInvite({
  permissions: ['SEND_MESSAGES', 'MANAGE_GUILD', 'MENTION_EVERYONE'],
})
  .then(link => console.log(`Generated bot invite link: ${link}`))
  .catch(console.error);
*/