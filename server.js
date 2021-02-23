require('dotenv').config();

const _ = require('lodash');

const { random, floor, round } = Math;

const Discord = require('discord.js');
const client = new Discord.Client();

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('message', message => {
  if(message.content[0]!=='!') return;
  processCommand(
    extractCommand(message.content),
    message
  );
});

function extractCommand(text) {
  const parts = text.substring(1).split(/\s/g);
  return {
    type: parts[0],
    args: parts.slice(1)
  };
}

function processCommand({type, args}, message) {
  switch(type) {
    case 'noppa':
      throwDice(message, args);
      break;
    case 'kumpi':
      chooseOne(message, args);
    default:
  }
}

function throwDice(message, args) {
  const sides = parseInt(args[0]) || 6;
  if(sides<=1) {
    message.reply('Aika kummallinen noppa.')
    return;
  }
  if(sides>200) {
    message.reply('Heitit palloa.');
    return;
  }
  const result = floor(random() * sides + 1);
  message.reply(`heitit ${
    sides===6?'':sides+'-sivuista '
  }noppaa, sait: ${result}.`);
}

const choosePrefixes = [
  'varmaan', 'ehkä', 'oisko', 'no tietysti', 'en tiiä, ehkä', 'en oo varma, mut kenties'
];
const chooseSuffixes = [
 '','','','','','','.','!','?','??','?!','?!'
];

function chooseOne(message, args) {
  const choices = args.join(' ').split(/,\s*|\s+vai\s+|\s+tai\s+/g);
  console.log(choices);
  if(choices.length<2) {
    message.reply('täh?');
    return;
  }
  const prefix = _.sample(choosePrefixes);
  const choice = _.sample(choices);
  const suffix = _.sample(chooseSuffixes);

  message.reply(`${ prefix } ${ choice }${ suffix }`);
}

client.login(process.env.TOKEN);

/*
client.generateInvite({
  permissions: ['SEND_MESSAGES', 'MANAGE_GUILD', 'MENTION_EVERYONE'],
})
  .then(link => console.log(`Generated bot invite link: ${link}`))
  .catch(console.error);
*/