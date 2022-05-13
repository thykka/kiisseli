import Custard from './custard.js';
import fetch from 'node-fetch';

class Minecraft extends Custard {
  constructor(options) {
    const defaults = {
      serverAddress: process.env.MC_SERVER_ADDRESS || 'localhost',
      serverPort: process.env.MC_SERVER_PORT || 25565,
      translations: {
        description_serverStatus: 'Minecraft server status',
        status_message: s => `Minecraft server status:
${ s.address }:${ s.port } (v${ s.version })
${ s.players } player${ s.players === 1 ? '' : 's' } online${
  s.motd ? '\nmotd: ' + s.motd : ''
}`,
        status_players: s => `${ s.players } player${ s.players === 1 ? '' : 's' } online`
      },
      commands: {
        serverStatus: ['mc'],
        serverPlayers: ['mcp']
      }
    };
    super(defaults, options);
    Object.assign(this, defaults, options);
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