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
        newKnotMessage: v => `Uusi ${v.points} pisteen solmu: ${v.flag} ${v.knot}`,
        showKnotMessage: v => `${v.flag}\n\tSolmu: ${v.knot} (${v.points}p)${v.hint?'\n\tVinkki: '+v.hint:''}`,
        showCurrentPointsMessage: v => `${v.answer} oli oikein! ${v.total - v.points}**+${v.points}** = ${v.total}p`,
        cannotBuyHintMessage: v => `Vinkki maksaa ${v.cost} piste${v.cost==1?'en':'ttä'}, sinulla on vain ${v.points}`,
        boughtHintMessage: v => `${v.player} osti vihjeen: ${v.hint}`,
        gameActivity: v => `Solmu: ${v.knot}`,
        descriptionNewGame: 'Näytä nykyinen solmu',
        descriptionRequestHint: v => `Paljastaa yhden kirjaimen solmusta. Maksaa ${ v.cost } piste${v.cost==1?'en':'ttä'}`,
        descriptionShowScores: 'Näytä pisteet',
        descriptionNewGameNumArg: 'Uusi solmu valitulla pituudella',
        descriptionNewGameLangArg: 'Uusi solmu valitulla kielellä',
        skipKnotMessage: v => `Sehän oli tietysti \`${v.answer}\`!`,
        cannotAffordSkip: v => `Ohittaminen maksaa ${v.cost} piste${v.cost==1?'en':'ttä'}, sinulla on vain ${v.points}`
      },
      rightEmoji: '😻',
      wrongEmoji: '😸',
      defaultLang: 'fi',
      hintCost: 3,
      hintDifficulty: 3,
      skipCost: 8,
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
    },{
      name: 'compliment',
      translations: {
        description_compliment: ':3'
      },
      commands: {
        compliment: ['kehu', '<3']
      }
    },{
      name: 'numbers',
      translations: {
        description_startGame: 'woot',
        description_registerAnswer: 'hoot'
      },
      commands: {
        startGame: ['num'],
        registerAnswer: ['=']
      }
    },{
      name: 'cat',
      //channelId: '813884640926105620', // #kiisseli
      channelId: '813896696492326953', // #kiisseli-beta
      interval: 1000 * 60,// * 60 * 24,
      appearMessages: [
        '/ᐠ.ꞈ.ᐟ\\ -miau',
        '^•ﻌ•^ฅ -kurnau'
      ],
      scoresCommand: 'miau',
      actions: [
        {
          trigger: 'silitä',
          success: 'Kissa kehrää! Olet silittänyt',
          failure: 'Kissa kävelee ohitsesi, yritä uudelleen.',
          invalid: 'Ei ole mitään silitettävää :(',
          difficulty: 0.33
        },
        {
          trigger: 'hätistä',
          success: 'Kissa pinkaisee karkuun! Olet hätistänyt',
          failure: 'Kissaa ei näytä kiinnostavan, yritä uudelleen.',
          invalid: 'Ketä oikein hätistelet? Ei täällä mitään ole!',
          difficulty: 0.5
        },
        {
          trigger: 'rapsuta',
          success: 'Kissa kiehnää tyytyväisenä! Olet rapsuttanut',
          failure: 'Kissa kellahtaa selälleen ja raapii, yritä uudelleen.',
          invalid: 'Erikoista tyhjänrapsuttelua..',
          difficulty: 0.67
        }
      ],
      units: [['sekunnin','sekuntia'],['minuutin','minuuttia'],['tunnin','tuntia'],['päivän','päivää'],['kuukauden','kuukautta']],
      statusMessage: v => `${v.successCount} kissa${v.successCount>1?'a':'n'}. Kissa sai odottaa ${v.reactionTime}`
    }
  ]
};
