import _ from 'lodash';
import Custard from './custard.js';

class Quotes extends Custard {
  constructor(options) {
    const defaults = {
      commands: {
        addQuote: ['quote'],
        getQuotes: ['quotes']
      },
      translations: {
        description_addReplyQuote: 'Add a quote (reply to the message to save)',
        description_addQuote: 'Add a quote manually',
        description_getQuotes: 'Search quotes',
        description_randomQuote: 'Random quote',
        searchTerms: 'search terms',
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

  async saveState() {
    await this.storage.setItem(this.storageKey, this.quotes);
  }

  async addQuote({ command, message }) {
    const messageRef = message.reference?.messageID;
    let quote;
    if(messageRef) {
      // Replying to a message with >quote
      const quoteMessage = await message.channel.messages.fetch(messageRef);
      quote = `${ quoteMessage.author.username }: ${ quoteMessage.content }`;
    } else {
      quote = this.parseQuote(message.content, command.name);
    }
    if(quote) {
      this.quotes.push(quote);
      this.saveState();
      message.react('✍');
    } else {
      // no quote or reply provided
      message.react('🙅');
    }
  }

  parseQuote(messageText) {
    const firstSpace = messageText.indexOf(' ')
    if(firstSpace < 0) return '';
    const quoteText = messageText.slice(firstSpace+1);
    return quoteText;
  }

  async getQuotes({ command, message }) {
    const { args } = command;
    if(args.length === 0) {
      args.push('');
    }
    const matchingQuotes = this.quotes.filter(q =>
      args.filter(t =>
        q.toLowerCase().includes(t.toLowerCase())
      ).length > 0
    );
    if(matchingQuotes.length === 0) {
      message.react('🤷');
      return;
    }
    const quote = _.sample(matchingQuotes);
    message.channel.send(`> ${quote}`);
  }

  listCommands() {
    return [{
      command: this.commands.addQuote[0],
      description: this.loc('description_addReplyQuote'),
      args: [{
        command: `${this.commands.addQuote[0]} <${ this.loc('exampleQuote') }>`,
        description: this.loc('description_addQuote')
      }]
    },{
      command: this.commands.getQuotes[0],
      description: this.loc('description_randomQuote'),
      args: [{
        command: `${this.commands.getQuotes[0]} <${ this.loc('searchTerms') }>`,
        description: this.loc('description_getQuotes')
      }]
    }]
  }
}

export default Quotes;