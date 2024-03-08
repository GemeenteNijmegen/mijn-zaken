import { User } from './User';
import { ZaakConnector, ZaakSummary } from './ZaakConnector';

interface Config {
  zaakConnectors: ZaakConnector[];
}
export class ZaakAggregator implements ZaakConnector {
  private zaakConnectors;

  constructor(config: Config) {
    this.zaakConnectors = config.zaakConnectors;
  }

  async list(user: User): Promise<ZaakSummary[]> {
    const listPromises = this.zaakConnectors.map(connector => connector.list(user));
    const results = await Promise.all(listPromises);

    return results.flat();
  }

  // async get(zaakId: string, user: User) {
  //   const zaak = await this.zaken.get(zaakId, user);
  //   return zaak;
  // }
}
