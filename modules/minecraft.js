import Custard from './custard.js';
import fetch from 'node-fetch';

class Minecraft extends Custard {
  constructor(options) {
    const defaults = {
      serverAddress: process.env.MC_SERVER_ADDRESS || 'localhost',
      serverPort: process.env.MC_SERVER_PORT || 25565,
      announceChannelId: false,
      announceFrequencyMinutes: 10,
      translations: {
        description_serverStatus: 'Minecraft server status',
        status_message: s => `Minecraft server status:
${ s.address }:${ s.port } (v${ s.version })
${ s.players } player${ s.players === 1 ? '' : 's' } online${
  s.motd ? '\nmotd: ' + s.motd : ''
}`,
        status_players: s => `${ s.players } player${ s.players === 1 ? '' : 's' } online`,
        announce_message: s => {
          const diff = s.players - s.previous.players;
          const dir = diff < 0 ? '📉' : '📈';
          return `MCFT ${dir}: ${ s.players } players online`;
        }
      },
      commands: {
        serverStatus: ['mc'],
        serverPlayers: ['mcp']
      }
    };
    super(defaults, options);
    Object.assign(this, defaults, options);
    this.boundCheckAnnounce = this.checkAnnounce.bind(this);
  }

  initEvents(events) {
    this.events = events;
    if(this.announceChannelId) {
      this.events.on('brain:connected', async client => {
        this.announceChannel = await client.channels.cache.get(this.announceChannelId);
        this.startAnnounce();
      });
    }
  }

  startAnnounce() {
    this.announceInterval = setInterval(
      this.boundCheckAnnounce, this.announceFrequencyMinutes * 1000 * 60
    );
    this.boundCheckAnnounce();
  }

  async checkAnnounce() {
    const status = await this.fetchStatus();
    if(!this.previousStatus) {
      this.previousStatus = status;
      return;
    }
    if(this.previousStatus.players !== status.players) {
      this.announceChannel.send(
        this.loc('announce_message', {
          ...status,
          previous: this.previousStatus
        })
      );
    }
    this.previousStatus = status;
  }

  async serverStatus({ message }) {
    const statusText = await this.getStatus();
    message.reply(statusText);
  }

  async serverPlayers({ message }) {
    const status = await this.fetchStatus();
    if(!status) message.react('😕');
    message.reply(this.loc('status_players', status));
  }

  async fetchStatus(address = this.serverAddress, port = this.serverPort) {
    const status = await fetch(`https://api.mcsrvstat.us/2/${address}:${port}`).then(r => r.json());
    if(typeof status !== 'object' || status === null) return false;
    return {
      address: status.hostname ?? address,
      port: status.port ?? port,
      online: status.online ?? false,
      players: status.players?.online ?? 0,
      version: status.version ?? '-',
      motd: status.motd?.clean ?? ''
    };
  }

  async getStatus() {
    const status = await this.fetchStatus();
    if(!status) return 'API down or error';
    return this.loc('status_message', status);
  }
}

export default Minecraft;
export { Minecraft };