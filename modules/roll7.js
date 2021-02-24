
const Storage = require('node-persist');

async function loadRoll7State() {
  const savedState = await Storage.getItem('Roll7_Best');
  return savedState || Infinity;
}

let S_Roll7;

(async function() {
  S_Roll7 = await loadRoll7State();
})();

function formatDice(result) {
  return '⚀⚁⚂⚃⚄⚅'[result-1];
}

async function processRoll7(message, args) {
  const best = S_Roll7;
  if(['paras', 'top'].includes(args[0])) {
    message.channel.send(`Paras heitto: ${best}`)
    return;
  }
  const roll = () => Math.floor(Math.random()*6)+1;
  const dice = Array.from({ length: 7 }, roll);
  const total = dice.reduce((a,d) => a+d, 0);
  const formattedDice = dice.map(d => formatDice(d)).join(' ');
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

module.exports=processRoll7;