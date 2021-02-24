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

const commands = [
  { fn: processRoll7, triggers: ['heitä7', '7'], title: 'Heitä 7 noppaa, pienin summa voittaa!' },
  { fn: throwDice, triggers: ['noppa','n'], title: 'Heitä noppaa. Esim. `!noppa 12` arpoo luvun 1 ja 12 väliltä.' },
  { fn: chooseOne, triggers: ['kumpi','k'], title: 'Valitse yksi. Esim. `!kumpi kissat vai koirat`.' },
  { fn: processWordGame, triggers: ['solmu','s'], title: 'Pelaa sanasolmua. Esim. `!solmu arvaus`' },
  { fn: processWordGamePoints, triggers: ['solmu-pisteet','s-pts'], title: 'Näytä sanasolmun pisteet.' },
  { fn: resetWordGame, triggers: ['solmu-uusi','s-uus'], title: 'Skippaa nykyinen sana (maksaa 10 pistettä)' },
  { fn: defineWordGameWord, triggers: ['sanakirja', 'sk'], title: 'Etsi sana wiktionarysta' },
  { fn: processZalgo, triggers: ['z', 'zalgo'], title: 'Zalgo' },
  { fn: processReact, triggers: ['react'] },
  { fn: showHelp, triggers: ['apua'], title: 'Näyttää toiminnot' }
];

client.on('message', message => {
  if(processChatter(message)) return;
  if(message.content[0]!=='!') return;
  processCommand(
    extractCommand(message.content),
    message
  );
});

client.login(process.env.TOKEN);

function extractCommand(text) {
  const parts = text.substring(1).split(/\s/g);
  return {
    type: parts[0],
    args: parts.slice(1)
  };
}

function processReact(message, args) {
  // TODO
}

function showHelp(message, args) {
  const result = commands.filter(c=>c.title && !c.hidden).map(c => c.triggers.map(t => '`!'+t+'`').join(',') + ' - ' + c.title).join('\n');
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
  if(sides === 6) {
    message.reply(`heitit noppaa: ${ formatDice(result) }`)
    return;
  }
  message.reply(`heitit ${ sides }-sivuista noppaa, sait: ${result}.`);
}
function formatDice(result) {
  return '⚀⚁⚂⚃⚄⚅'[result-1];
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

const WordGameWords = require('./wordgame-words-big.js');

async function loadWordGameState() {
  return await Storage.getItem('WordGame_State') || {
    currentWord: null, currentAnswer: null
  };
}
let S_WordGame = await loadWordGameState();
function processWordGame(message, args) {
  if(!S_WordGame.currentWord) {
    if(parseInt(args[0]).toString() !== args[0]) {
      message.reply('Sanasolmu ei ole käynnissä. Koita `!s-uus`');
      return;
    }
    getNewWord(message, args);
    return;
  }
  else if(args.length === 0) {
    showCurrentWord(message);
    return;
  }
  checkWord(message,args);
}

// This counts each successful attempt at guessing the word
// Should probably be saved in storage too, but it's more
// ephemeral than the other stuff, so this will do for now..
let WordGame_Attempts = 0;
function getNewWord(message, args) {
  const wordLength = parseInt(args[0] || (S_WordGame.currentWord || '     ').length);
  const selectedWords = WordGameWords.filter(w => w.length === wordLength);
  if(!selectedWords.length) {
    message.reply(`En tiedä tuon pitusia sanoja..`)
    return;
  }
  WordGame_Attempts = 0;
  S_WordGame.currentAnswer = _.sample(selectedWords);
  do {
    S_WordGame.currentWord = _.shuffle([...S_WordGame.currentAnswer]).join('').toUpperCase();
  } while (S_WordGame.currentWord !== S_WordGame.currentWord.toUpperCase())

  Storage.setItem('WordGame_State', S_WordGame);
  message.channel.send(`Uusi sanasolmu: ${ S_WordGame.currentWord }`);
}
function showCurrentWord(message) {
  message.channel.send(`Sanasolmu: ${ S_WordGame.currentWord }`);
}

function checkWord(message, args) {
  if(args[0].toUpperCase() === S_WordGame.currentAnswer.toUpperCase()) {
    addWordgamePoint(message.author);
    const currentPoints = getWordgamePoints(message.author);
    message.reply(`Oikein! Sinulla on ${ currentPoints } piste${ currentPoints > 1 ? 'ttä' : ''}.`);
    // show definition, if word was difficult
    if(WordGame_Attempts > 2) {
      defineWordGameWord(message, [S_WordGame.currentAnswer]);
    }
    getNewWord(message, [S_WordGame.currentWord.length]);
    return;
  }
  // check if attempted word has at least the same letters
  const sameLetters= [...args[0].toUpperCase()].sort().join('') ===
    [...S_WordGame.currentAnswer.toUpperCase()].sort().join('');
  if(sameLetters) {
    WordGame_Attempts = (WordGame_Attempts || 0) + 1;
  }
  console.log(`Attempts: ${ WordGame_Attempts }`);
}
function resetWordGame(message, args) {
  const userPoints = HS_WordGame[message.author.username];
  if(S_WordGame.currentWord){
    if(userPoints >= 10) {
      message.channel.send(`Sana oli ${ S_WordGame.currentAnswer}.`);
      defineWordGameWord(message, [S_WordGame.currentAnswer]);
      S_WordGame.currentWord = null;
      S_WordGame.currentAnswer = null;
      Storage.setItem('WordGame_State', S_WordGame);
      HS_WordGame[message.author.username] -= 10;
      Storage.setItem('WordGame_HiScores', HS_WordGame);
    } else {
      message.reply(`Sanan ohittaminen maksaa 10 pistettä, sulla on vain ${ userPoints }`);
      return;
    }
  }
  getNewWord(message, args);
}
function defineWordGameWord(message, args) {
  message.channel.send(`https://fi.wiktionary.org/w/index.php?title=${ args.join(' ') }`);
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

async function loadRoll7State() {
  const savedState = await Storage.getItem('Roll7_Best');
  return savedState || Infinity;
}
let S_Roll7 = await loadRoll7State();

async function processRoll7(message) {
  const roll = () => floor(Math.random()*6)+1;
  const dice = Array.from({ length: 7 }, roll);
  const total = dice.reduce((a,d) => a+d, 0);
  const formattedDice = dice.map(d => formatDice(d)).join(' ');
  const best = S_Roll7;
  if(total < best) {
    S_Roll7 = total;
    await Storage.setItem('Roll7_Best', S_Roll7);
    message.reply(`Heitit ${formattedDice} (${total}) - Uusi ennätys!`);
  } else {
    message.reply(`Heitit ${formattedDice} (${total})`);
  }
  if (total === 7) {
    message.reply(`Heitit ${formattedDice} (${total}) - Se siitä sitten, voitit pelin!`)
  }
}


function processChatter(message) {
  if(typeof message.content === 'string' && message.content.includes('perjantai')) {
    message.reply('PeRjAnTaIiIiI!!! :tada:');
    return true;
  }
  return false;
}

const Zalgo = require('to-zalgo');
function processZalgo(message, args) {
  message.reply(Zalgo(args.join(' ')));
}
/*
client.generateInvite({
  permissions: ['SEND_MESSAGES', 'MANAGE_GUILD', 'MENTION_EVERYONE'],
})
  .then(link => console.log(`Generated bot invite link: ${link}`))
  .catch(console.error);
*/
})();
