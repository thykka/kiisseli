import NodeHtmlParser from 'node-html-parser';
const { parse } = NodeHtmlParser;
import wiktionary from 'wiktionary';
import Translation from './translation.js';

class Dictionary {
  constructor(options) {
    const defaults = {
      commands: {
        definition: ['definition']
      },
      language: null,
      translations: {
        noResultsMessage: 'No results',
        definitionError: 'Something went wrong.',
        definitionTypeHint: 'Word',
        definitionDescription: 'Search for a word definition'
      }
    }
    Object.assign(this, defaults, options);
    this.loc = new Translation(this.translations).localize;
  }

  initEvents(events) {
    Object.entries(this.commands).forEach(([actionName, triggers]) => {
      triggers.forEach(trigger => {
        events.on(`command:${ trigger }`, this[actionName].bind(this));
      });
    });
  }

  definition({ message, command }) {
    const word = command.args.find(arg => typeof arg === 'string' && arg.length);
    wiktionary(word, this.language).then(result => {
      message.reply(`${ word }\n${ this.processResult(result) }`)
    });
  }

  processResult(result) {
    try {
      if(!result || typeof result.html !== 'string') {
        if(result && result.text) return result.text
        return this.loc('noResultsMessage');
      }
      const root = parse(result.html);
      const foundDefs = root.querySelectorAll('ol>li');
      if(!foundDefs) return this.loc('notFoundMessage');
      return [...foundDefs].map(def => '* ' + def.innerText).join('\n');
    } catch(e) {
      console.log(e.message, e.stack);
      return this.loc('definitionError');
    }
  }

  listCommands() {
    return [
      {
        command: `${
          this.commands.definition[0]
        } <${
          this.loc('definitionTypeHint')
        }>`,
        description: this.loc('definitionDescription')
      }
    ]
  }
}

export default Dictionary;