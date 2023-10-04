import { OpenZaakClient } from './OpenZaakClient';

export class Taken {
  private client: OpenZaakClient;
  constructor(client: OpenZaakClient) {
    this.client = client;
  }

  async get(zaakId: string) {
    const data = await this.client.request(zaakId);
    return data;
  }
}
