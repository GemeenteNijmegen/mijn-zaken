import { OpenZaakClient } from './OpenZaakClient';

export class Taken {
  private client: OpenZaakClient;
  constructor(client: OpenZaakClient) {
    this.client = client;
  }

  async get(zaakId: string) {
    console.debug(`getting taken for zaak ${zaakId}`);
    const data = await this.client.request(zaakId);
    return data;
  }
}
