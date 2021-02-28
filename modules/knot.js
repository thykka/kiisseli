import BM from './botModule.js';

class KnotGame extends BM {
  constructor(options) {
    super({
      title: 'KnotGame'
    }, options);    
  }
}

export { KnotGame };
export default KnotGame;