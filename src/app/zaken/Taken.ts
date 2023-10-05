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
      return data.results
        .filter((result: any) => {
          return result?.record?.data?.title && result?.record?.data?.formulier && result?.record?.data?.verloopdatum;
        })
        .map((result: any) => {
          console.debug(result);
          return {
            title: result.record.data.title,
            url: result.record.data.formulier.value,
            einddatum: this.formattedDate(result.record.data.verloopdatum),
          };
        });
    }
    return data ? data : null;
  }

  private formattedDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
  }
}
