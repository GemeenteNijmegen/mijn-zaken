import axios from "axios";
import { OpenZaakClient } from "../OpenZaakClient";
import { Statuses } from "../Statuses";
import MockAdapter from 'axios-mock-adapter';

const axiosMock = new MockAdapter(axios);
beforeEach(() => {
  axiosMock.reset();
});

describe('Statuses', () => {
  test('constructing object succeeds', async () => {
    axiosMock.onGet().reply(200, []);
    const client = new OpenZaakClient({ baseUrl: new URL('https://example.com'), axiosInstance: axios.create() })
    expect(() => { new Statuses(client) }).not.toThrow();
  });

  test('list returns zaken', async () => {
    const client = new OpenZaakClient({ 
      baseUrl: new URL('https://openzaak.woweb.app'),
      clientId: process.env.CLIENT_ID,
      userId: process.env.USER_ID,
      secret: process.env.SECRET
    });
    const statuses  = new Statuses(client);
    const zaken = await statuses.list();
    console.debug(zaken);
    expect(zaken.length).toBeGreaterThanOrEqual(0);
  });
});
