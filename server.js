require('dotenv').config();
const _ = require('lodash');
const Storage = require('node-persist');

(async function() {

await Storage.init();

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

const commands = [
  { fn: throwDice, triggers: ['n', 'noppa'], title: 'Heitä noppaa. Esim. `!noppa 12` arpoo luvun 1 ja 12 väliltä.' },
  { fn: chooseOne, triggers: ['k', 'kumpi'], title: 'Valitse yksi. Esim. `!kumpi kissat vai koirat`.' },
  { fn: processWordGame, triggers: ['s', 'solmu'], title: 'Pelaa sanasolmua. Esim. `!solmu arvaus`' },
  { fn: processWordGamePoints, triggers: ['s-pts', 'solmu-pisteet'], title: 'Näytä sanasolmun pisteet.' },
  { fn: resetWordGame, triggers: ['s-uus', 'solmu-uusi'], title: 'Skippaa nykyinen sana' },
  { fn: showHelp, triggers: ['apua', 'komennot'], title: 'Näyttää toiminnot' }
];

function showHelp(message, args) {
  const result = commands.map(c => c.triggers.map(t => '`!'+t+'`').join(',') + ' - ' + c.title).join('\n');
  message.reply(result);
}

function processCommand({type, args}, message) {
  const selectedCommand = commands.find(c => c.triggers.includes(type));
  if(!selectedCommand) return;
  selectedCommand.fn(message, args);
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
  if(choices.length<2) {
    message.reply('täh?');
    return;
  }
  const prefix = _.sample(choosePrefixes);
  const choice = _.sample(choices);
  const suffix = _.sample(chooseSuffixes);

  message.reply(`${ prefix } ${ choice }${ suffix }`);
}

const S_WordGame = {
  currentWord: null,
  currentAnswer: null
};

const WordGameWords = require('./wordgame-words.js');

function resetWordGame(message, args) {
  if(!S_WordGame.currentWord) {
    message.reply(`Ei tässä sanasolmu ollut käynnissä muutenkaan.`);
    return;
  }
  S_WordGame.currentWord = null;
  S_WordGame.currentAnswer = null;
  processWordGame(message, args);
}

function processWordGame(message, args) {
  if(!S_WordGame.currentWord) {
    const wordLength = parseInt(args[0] || 5);
    const selectedWords = WordGameWords.filter(w => w.length === wordLength);
    if(!selectedWords.length) {
      message.reply(`En tiedä tuon pitusia sanoja..`)
      return;
    }
    S_WordGame.currentAnswer = _.sample(selectedWords);
    S_WordGame.currentWord = _.shuffle([...S_WordGame.currentAnswer]).join('').toUpperCase();
    message.reply(`Uusi sanasolmu: ${ S_WordGame.currentWord }`);
    return;
  }
  else if(args.length === 0) {
    message.reply(`Sanasolmu: ${ S_WordGame.currentWord }`);
    return;
  }
  if(args[0].toUpperCase() === S_WordGame.currentAnswer.toUpperCase()) {
    addWordgamePoint(message.author);
    const currentPoints = getWordgamePoints(message.author);
    message.reply(`Oikein! Sinulla on ${ currentPoints } piste${ currentPoints > 1 ? 'ttä' : ''}.`);
    S_WordGame.currentWord = null;
    S_WordGame.currentAnswer = null;
    return;
  }
}

async function loadWordGameHiscores() {
  return await Storage.getItem('WordGame_HiScores') || {};
}

const HS_WordGame = await loadWordGameHiscores();

async function addWordgamePoint(author) {
  const { username } = author;
  if(!HS_WordGame[username]) {
    HS_WordGame[username] = 0;
  }
  HS_WordGame[username] += 1;
  await Storage.setItem('WordGame_HiScores', HS_WordGame);
}
function getWordgamePoints(author) {
  const { username } = author;
  return HS_WordGame[username] || 0;
}
function processWordGamePoints(message, [username] = []) {
  if(username && HS_WordGame[username]) {
    message.reply(`Käyttäjän ${username} pisteet: ${ HS_WordGame[username] }`);
    return;
  }
  const result = Object.entries(HS_WordGame).map(([user,points]) => `${ user }: ${ points }`).join('\n');
  message.reply(result);
}

client.login(process.env.TOKEN);

/*
client.generateInvite({
  permissions: ['SEND_MESSAGES', 'MANAGE_GUILD', 'MENTION_EVERYONE'],
})
  .then(link => console.log(`Generated bot invite link: ${link}`))
  .catch(console.error);
*/
})();
