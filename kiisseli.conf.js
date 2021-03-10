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
      maxSides: 9000,
      maxDice: 32,
      translations: {
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
      translations: {
        newKnotMessage: v => `Uusi solmu: ${v.flag} ${v.knot}`,
        showKnotMessage: v => `${v.flag}\n\tSolmu: ${v.knot}${v.hint?'\n\tVinkki: '+v.hint:''}`,
        showCurrentPointsMessage: v => `sait ${v.points} piste${v.points==1?'en':'ttä'}! Yhteensä ${v.total}`,
        cannotBuyHintMessage: v => `Vinkki maksaa ${v.cost} pistettä, sinulla on vain ${v.points}`,
        boughtHintMessage: v => `${v.player} osti vihjeen: ${v.hint}`,
        gameActivity: v => `Solmu: ${v.knot}`,
        descriptionNewGame: 'Näytä nykyinen solmu',
        descriptionRequestHint: v => `Paljastaa yhden kirjaimen solmusta. Maksaa ${ v.cost } pistettä`,
        descriptionShowScores: 'Näytä pisteet',
        descriptionNewGameNumArg: 'Uusi solmu valitulla pituudella',
        descriptionNewGameLangArg: 'Uusi solmu valitulla kielellä',
      },
      rightEmoji: '😻',
      wrongEmoji: '😸',
      defaultLang: 'fi',
      hintCost: 2,
      lengthProbabilities: [0,1,1,10,20,10,5,2,1,1,1,1]
    },{
      name: 'dictionary',
      commands: {
        definition: ['sanakirja', 'sk']
      },
      language: 'fi',
      translations: {
        noResultsMessage: 'Ei löytyny',
        definitionError: 'Huppista saatana',
        definitionTypeHint: 'Sana',
        definitionDescription: 'Etsi sanan määritelmää (suomeksi)'
      }
    },{
      name: 'pics',
      commands: {
        getPicture: ['kuva', 'k']
      },
      translations: {
        getPictureDescription: 'Satunnainen kissakuva'
      }
    }
  ]
};
