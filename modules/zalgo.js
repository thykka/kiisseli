
const Zalgo = require('to-zalgo');

function processZalgo(message, args) {
  message.reply(Zalgo(args.join(' ')));
}

module.exports=processZalgo;
