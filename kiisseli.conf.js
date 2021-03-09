export default {
  autoConnect: true,
  commandPrefix: '.',
  commandsDescription: 'Komennot:',
  commandsSelfDescription: 'Näyttää komennot',
  modules: [
    {
      name: 'reacts',
      reactions: [
        [/(kis(u\b|sa|soja\b)|kiissel)/, '🐈'],
        ['bileet', '🎉'],
      ]
    },{
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
        rollDice_total: 'yht.',
        rollRandomDescription: 'Heitä 6-sivuista noppaa',
        rollDiceDescription: 'Heitä viisi noppaa',
        rollRandomSidesDescription: 'Heitä noppaa, jossa valittu määrä sivuja',
        rollDiceCountDescription: 'Heitä valittu määrä noppia'
      },
      commands: {
        rollRandom: ['noppa', 'n'],
        rollDice: ['nopat', 'np']
      }
    },{
      name: 'knot',
      allowedChannels: [
        //'813884640926105620', // #kiisseli
        '813896696492326953', // #kiisseli-beta
      ], 
      commandsNewGame: ['solmu','s'],
      commandsShowScores: ['solmu.pisteet','s.'],
      commandsRequestHint: ['solmu.vihje','s?'],
      newKnotMessage: f => `Uusi solmu: ${ f.flag } ${ f.knot }`,
      showKnotMessage: f => `${ f.flag }\n\tSolmu: ${ f.knot }${ f.hint ? '\n\tVinkki: ' + f.hint : '' }`,
      showCurrentPointsMessage: f => `sait ${ f.points } piste${ f.points == 1 ? 'en' : 'ttä' }! Yhteensä ${ f.total }`,
      cannotBuyHintMessage: f => `Vinkki maksaa ${f.cost} pistettä, sinulla on vain ${f.points}`,
      boughtHintMessage: f => `${f.player} osti vihjeen: ${f.hint}`,
      gameActivity: f => `Solmu: ${f.knot}`,
      descriptionNewGame: 'Näytä nykyinen solmu',
      descriptionRequestHint: f => `Paljastaa yhden kirjaimen solmusta. Maksaa ${ f.cost } pistettä`,
      descriptionShowScores: 'Näytä pisteet',
      descriptionNewGameNumArg: 'Uusi solmu valitulla pituudella',
      descriptionNewGameLangArg: 'Uusi solmu valitulla kielellä',
      rightEmoji: '😻',
      wrongEmoji: '😸',
      defaultLang: 'fi',
      hintCost: 2,
      lengthProbabilities: [0,1,1,10,20,10,5,2,1,1,1,1]
    }
  ]
};
