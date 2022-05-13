console.log((new Date).toISOString() + ' Initiation sequence begin');

import Brain from './modules/brain.js';
import Config from './kiisseli.conf.js';

new Brain(process.env.TOKEN, Config);
