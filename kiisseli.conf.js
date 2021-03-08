export default {
  autoConnect: true,
  commandPrefix: '=',
  modules: [
    {
      name: 'dice',
      //icons: ['⓿','❶','❷','❸','❹','❺','❻','❼','❽','❾']
      //minSides: 2,
      maxSides: 9000,
      maxDice: 32,
      translations: { // Don't do this, make a translation module or something
        rollRandom_argTooSmall: 'liian pieni numero',
        rollRandom_argTooBig: 'liian iso numero',
        rollRandom_malformedNumber: 'tarvitsee numeron',
        rollRandom_result: 'heitit',
        rollDice_validRange: 'anna numero väliltä',
        rollDice_result: 'heitit',
        rollDice_total: 'yht.'
      },
      commands: {
        rollRandom: ['random', 'r'],
        rollDice: ['heitä', 'h']
      }
    },{
      name: 'knot',
      allowedChannels: [
        //'813884640926105620', // #kiisseli
        '813896696492326953', // #kiisseli-beta
      ], 
      commandsNewGame: ['s', 'solmu'],
      commandsShowScores: ['s.', 'solmu.pisteet'],
      commandsRequestHint: ['s?', 'solmu.vihje'],
      newKnotMessage: 'Uusi solmu:',
      showKnotMessage: 'Solmu:',
      announcePointsNewMessage: 'Pisteet:',
      announcePointsTotalMessage: 'Yhteensä:',
      cannotBuyHintMessage: f => `Ei pysty. Tarvitset ${f.cost} pistettä, sinulla on vain ${f.points}.`,
      boughtHintMessage: f => `${f.player} osti vihjeen: ${f.hint}`,
      gameActivity: f => `Solmu: ${f.knot}`,
      defaultLang: 'fi',
      hintCost: 2
    }
  ]
};
