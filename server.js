require('dotenv').config();
const _ = require('lodash');
const Storage = require('node-persist');
const Discord = require('discord.js');
const { random, floor } = Math;

const CatPics = require('./modules/catpics.js');

const WordGame_PointCost = 8;

(async function() {

await Storage.init();

const commands = [
  { fn: require('./modules/roll7.js'), triggers: ['heitä7', '7'], title: 'Heitä 7 noppaa, pienin summa voittaa!' },
  { fn: throwDice, triggers: ['noppa','n'], title: 'Heitä noppaa. Esim. `!noppa 12` arpoo luvun 1 ja 12 väliltä' },
  { fn: chooseOne, triggers: ['kumpi','k'], title: 'Valitse yksi. Esim. `!kumpi kissat vai koirat`' },
  { fn: processWordGame, triggers: ['solmu','s'], title: 'Pelaa sanasolmua. Esim. `!solmu arvaus`' },
  { fn: processWordGamePoints, triggers: ['solmu-pisteet','s-pts'], title: 'Näytä sanasolmun pisteet' },
  { fn: processWordGameHint, triggers: ['solmu-vinkki','?'], title: 'Osta vinkki sanasolmuun' },
  { fn: resetWordGame, triggers: ['solmu-uusi','s-uus'], title: `Skippaa nykyinen sana (maksaa ${WordGame_PointCost} pistettä)` },
  { fn: defineWordGameWord, triggers: ['sanakirja', 'sk'], title: 'Etsi sana wiktionarysta' },
  { fn: CatPics.randomCatPic, triggers: ['kuva'], title: 'Satunnainen kissakuva' },
  { fn: processIsIt, triggers: ['onko'] },
  { fn: processReact, triggers: ['react'] },
  { fn: require('./modules/zalgo.js'), triggers: ['z'] },
  { fn: showHelp, triggers: ['apua','halp','help','apuva','komennot','commands'], title: 'Näyttää toiminnot' }
];

const client = new Discord.Client();
client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
  updateWordGamePresence(client);
});

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

function showHelp(message) {
  const result = commands.filter(c => c.title && !c.hidden)
    .map(c => `\`!${ c.triggers[0] }\` - ${ c.title }\n`)
    .join('');
  message.reply('\n' + result);
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
function updateWordGamePresence(client) {
  client.user.setPresence({
    activity: {
      name: `Solmu: ${ S_WordGame.currentWord }`,
      type: 'PLAYING'
    },
    status: 'online'
  });
}
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
const WordGame_difficulty = 0.2;
/*
// TODO: Split this to getNewWord and sayNewWord or something,
//  because rn it's possible that getting a word fails, and
//  we need to not subtract points from skips when it happens.
*/
function getNewWord(message, args) {
  const customLength = typeof args === 'number' ? args
    : Array.isArray(args) && typeof args[0] === 'string' && parseInt(args[0])
  
  const wordLength = customLength || floor(
    // random between 4 and 10, biased towards shorter words
    5 + random() * random() * random() * 5 + WordGame_difficulty
  );

  const selectedWords = WordGameWords.filter(w => w.length === wordLength);
  if(selectedWords.length < 10) {
    message.reply(`En tiedä tarpeeksi ${ wordLength }-kirjaimisia sanoja..`)
    return;
  }
  WordGame_Attempts = 0;
  S_WordGame.currentAnswer = _.sample(selectedWords);
  let tries = 0;
  do {
    S_WordGame.currentWord = _.shuffle([...S_WordGame.currentAnswer]).join('').toUpperCase();
    tries++;
  } while (S_WordGame.currentWord === S_WordGame.currentAnswer.toUpperCase() || tries < 100)

  Storage.setItem('WordGame_State', S_WordGame);
  message.channel.send(`Uusi sanasolmu: ${ S_WordGame.currentWord }`);
  updateWordGamePresence(client);
}
function showCurrentWord(message) {
  message.channel.send(`Sanasolmu: ${ S_WordGame.currentWord }`);
}

function checkWord(message, args) {
  if(args[0].toUpperCase() === S_WordGame.currentAnswer.toUpperCase()) {
    addWordgamePoints(message.author, S_WordGame.currentAnswer.length - 3);
    const currentPoints = getWordgamePoints(message.author);
    message.react('🥇');
    message.reply(`Oikein! Sinulla on ${ currentPoints } piste${ currentPoints > 1 ? 'ttä' : ''}.`);
    // show definition, if word was difficult
    if(WordGame_Attempts > 4) {
      message.react('😻');
      defineWordGameWord(message, [S_WordGame.currentAnswer]);
    }
    getNewWord(message);
    return;
  }
  // check if attempted word has at least the same letters
  const sameLetters= [...args[0].toUpperCase()].sort().join('') ===
    [...S_WordGame.currentAnswer.toUpperCase()].sort().join('');
  if(sameLetters) {
    WordGame_Attempts = (WordGame_Attempts || 0) + 1;
    message.react('😸');
  } else {
    const emoji = message.guild.emojis.cache.find(emoji => emoji.name === 'derpcat');
    message.react(emoji);
  }
  console.log(`Attempts: ${ WordGame_Attempts }`);
}
function resetWordGame(message, args) {
  const userPoints = HS_WordGame[message.author.username];
  if(S_WordGame.currentWord){
    if(userPoints >= WordGame_PointCost) {
      message.channel.send(`Sana oli ${ S_WordGame.currentAnswer}.`);
      defineWordGameWord(message, [S_WordGame.currentAnswer]);
      HS_WordGame[message.author.username] -= WordGame_PointCost;
      Storage.setItem('WordGame_HiScores', HS_WordGame);
    } else { // exit early, user doesn't have enough points
      message.reply(`Sanan ohittaminen maksaa ${ WordGame_PointCost } pistettä, sulla on vain ${ userPoints }`);
      return;
    }
  }
  getNewWord(message, args);
}
function defineWordGameWord(message, args) {
  message.channel.send(`https://en.wiktionary.org/wiki/${ args.join(' ') }#Finnish`);
}

async function loadWordGameHiscores() {
  return await Storage.getItem('WordGame_HiScores') || {};
}
const HS_WordGame = await loadWordGameHiscores();
async function addWordgamePoints(author, amount = 1) {
  const { username } = author;
  if(!HS_WordGame[username]) {
    HS_WordGame[username] = 0;
  }
  HS_WordGame[username] += amount;
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
  const result = Object.entries(HS_WordGame)
    .sort(([_,aPoints],[__,bPoints]) => bPoints - aPoints)
    .map(([user,points]) => `${ 'l'.repeat(points/10) } ${ user }: ${ points }`)
    .join('\n');
  message.channel.send('.\n' + result);
}
function processWordGameHint(message) {
  const hintIndex = floor(random() * S_WordGame.currentAnswer.length);
  const hint = [...S_WordGame.currentAnswer].map((letter,index) => {
    return index === hintIndex ? letter : '\_'
  }).join(' ');
  message.reply(hint);
}

function processChatter(message) {
  // don't react to self, potential endless loop
  if(message.author.equals(client.user)) return;
  /*
  if(
    typeof message.content === 'string' && (
      message.content.includes('perjantai') ||
      message.content.includes('tgif')
    )
  ) {
    message.reply('PeRjAnTaIiIiI!!! :tada:');
    return true;
  }
  */
  if(
    message.content.match(/kissa|katti|mirri|kiisseli/)
  ) {
    message.react('🐈');
  }
  return false;
}

function processIsIt(message, args) {
  if(args[0].match(/perjantai\??/i)) {
    const now = new Date();
    if(now.getDate() === 5) {
      message.reply('ON!');
    } else {
      message.reply('Ei...');
    }
  }
}

/*
client.generateInvite({
  permissions: ['SEND_MESSAGES', 'MANAGE_GUILD', 'MENTION_EVERYONE'],
})
  .then(link => console.log(`Generated bot invite link: ${link}`))
  .catch(console.error);
*/
})();
