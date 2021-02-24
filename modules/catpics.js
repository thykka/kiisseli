const fetch = require('node-fetch');

function randomCatPic(message) {
  fetch('https://api.thecatapi.com/v1/images/search')
    .then(res=>res.json())
    .then(res=>{
      if(!Array.isArray(res) || !res.length) return;
      const { url } = res[0];
      if(!url) return;
      message.channel.send(url);
    });
}

module.exports = {
  randomCatPic
};