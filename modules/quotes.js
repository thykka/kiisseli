import _ from 'lodash';
import Custard from './custard.js';

class Quotes extends Custard {
  constructor(options) {
    const defaults = {
      commands: {
        quote: ['q']
      },
      translations: {
        description_quote_random: 'Show a random quote',
        description_quote_search: 'Search for a quote',
        description_quote_add: 'Add a quote',
        description_quote_reply: '(as a reply) Add a quote',
        searchTerms: 'buzz',
        exampleQuote: 'Melissa: What\'s all the buzz about?'
      },
      storageKey: 'quotes'
    };
    super(defaults, options);
    Object.assign(this, defaults, options);
  }

  async initStorage(storage) {
    this.storage = storage;
    this.quotes = await this.storage.getItem(this.storageKey) || [];
  }

  async quote({ command, message }) {
    const messageRef = message.reference?.messageID;
    let quote;
    if(messageRef) {
      // adding quote by replying
      const targetMessage = await message.channel.messages.fetch(messageRef);
      if(targetMessage) {
        this.saveQuote(`${ targetMessage.author.username }: ${ targetMessage.content }`);
      }
    } else if(message.content.includes(':')) {
      // adding quote manually
      quote = this.parseQuote(message.content);
      if(quote) {
        this.saveQuote(quote);
        message.react('✍');
      }
    } else {
      // querying quotes
      const foundQuote = this.queryQuotes(command.args);
      if(foundQuote) {
        message.channel.send(`> ${foundQuote}`);
      } else {
        message.react('🤷');
      }
    }
  }

  saveQuote(quoteText) {
    this.quotes.push(quoteText);
    this.saveState();
  }

  async saveState() {
    await this.storage.setItem(this.storageKey, this.quotes);
  }

  parseQuote(quoteText) {
    const firstSpace = quoteText.indexOf(' ');
    return firstSpace < 0 ? '' : quoteText.slice(firstSpace+1);
  }

  queryQuotes(keywords = []) {
    if(keywords.length === 0) keywords.push('');
    const matchingQuotes = this.quotes.filter(q =>
      keywords.every(k =>
        q.toLowerCase().includes(k.toLowerCase())
      )
    );
    if(matchingQuotes.length === 0) {
      return false;
    }
    return _.sample(matchingQuotes);
  }

  listCommands() {
    const command = this.commands.quote[0];
    return [{
      command,
      description: this.loc('description_quote_random'),
      args: [{
        command: `${command} <${ this.loc('searchTerms') }>`,
        description: this.loc('description_quote_search')
      },{
        command: `${command} <${ this.loc('exampleQuote') }>`,
        description: this.loc('description_quote_add')
      },{
        command,
        description: this.loc('description_quote_reply')
      }]
    }]
  }
}

export default Quotes;