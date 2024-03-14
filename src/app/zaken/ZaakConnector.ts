import { User } from './User';


export interface ZaakSummary {
  identifier: string;
  internal_id: string;
  registratiedatum?: Date;
  verwachtte_einddatum?: Date;
  uiterlijke_einddatum?: Date;
  einddatum?: Date;
  zaak_type: string;
  status: string;
  resultaat?: string;
}

export interface SingleZaak {
  identifier: string;
  internal_id: string;
  registratiedatum?: Date;
  verwachtte_einddatum?: Date;
  uiterlijke_einddatum?: Date;
  einddatum?: Date;
  zaak_type: string;
  status: string;
  status_list: any[];
  resultaat?: string;
  documenten?: any[];
  taken: any[];
}

export interface ZaakConnector {
  list(user: User): Promise<ZaakSummary[]>;
  get(zaakId: string, user: User): Promise<SingleZaak|false>;
}
