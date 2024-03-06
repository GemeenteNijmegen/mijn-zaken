import { OpenZaakClient } from './OpenZaakClient';

export class Taken {
  private client: OpenZaakClient;
  constructor(client: OpenZaakClient) {
    this.client = client;
  }

  async get(zaakId: string) {
    console.debug(`getting taken for zaak ${zaakId}`);
    const data = await this.client.request(zaakId);
    if (data?.count > 0) {
      console.debug(`found ${data.count} results`);
      return data.results
        .filter((result: any) => {
          return (
            result?.record?.data?.zaak &&
            (result?.record?.data?.zaak as string).endsWith(zaakId) &&
            result?.record?.data?.title &&
            result?.record?.data?.formulier &&
            result?.record?.data?.verloopdatum);
        })
        .map((result: any) => {
          return {
            title: result.record.data.title,
            url: result.record.data.formulier.value,
            einddatum: this.formattedDate(result.record.data.verloopdatum),
            is_open: result.record.data.status == 'open',
            is_ingediend: result.record.data.status == 'ingediend',
            is_gesloten: result.record.data.status == 'gesloten',
          };
        });
    } else {
      console.debug('found no results');
      return null;
    }
  }


  private formattedDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
  }
}
