import Brain from './modules/brain.js';

(async function() {

  const b = new Brain({
    moduleNames: ['knot'],
    moduleOptions: {
      knot: { title: 'Sanasolmu' }
    },
    token: process.env.TOKEN
  });
  await b.init();

  console.log(b)
})()