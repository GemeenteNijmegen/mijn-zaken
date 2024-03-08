import { User } from './User';
import { Zaken } from './Zaken';

// interface ZaakSummary {
//   identifier: string;
//   internal_id: string;
//   registratiedatum: Date;
//   verwachtte_einddatum?: Date;
//   uiterlijke_einddatum?: Date;
//   einddatum?: Date;
//   zaak_type: string;
//   status: string;
//   resultaat?: string;
// }

interface Config {
  zaken: Zaken;
}
export class ZaakAggregator {
  private zaken;

  constructor(config: Config) {
    this.zaken = config.zaken;
  }

  async list(user: User) {
    const zaken = await this.zaken.list(user);
    return zaken;
  }

  async get(zaakId: string, user: User) {
    const zaak = await this.zaken.get(zaakId, user);
    return zaak;
  }
}
