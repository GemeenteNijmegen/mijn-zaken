import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { OpenZaakClient } from '../OpenZaakClient';
import { Statuses } from '../Statuses';

let baseUrl = new URL('http://localhost');
if (process.env.VIP_BASE_URL) {
  baseUrl = new URL(process.env.VIP_BASE_URL);
}

const axiosMock = new MockAdapter(axios);
beforeEach(() => {
  axiosMock.reset();
});

describe('Statuses', () => {
  test('constructing object succeeds', async () => {
    axiosMock.onGet().reply(200, []);
    const client = new OpenZaakClient({ baseUrl, axiosInstance: axios.create() });
    expect(() => { new Statuses(client); }).not.toThrow();
  });

  // test('list returns zaken', async () => {
  //   if(!process.env.VIP_JWT_SECRET) {
  //     console.debug('Secret must be provided for live test, skipping');
  //     return;
  //   }
  //   const client = new OpenZaakClient({
  //     baseUrl,
  //     clientId: process.env.VIP_JWT_CLIENT_ID,
  //     userId: process.env.VIP_JWT_USER_ID,
  //     secret: process.env.VIP_JWT_SECRET
  //   });
  //   const statuses  = new Statuses(client);
  //   const zaken = await statuses.list();
  //   console.debug(zaken);
  //   expect(zaken.length).toBeGreaterThanOrEqual(0);
  // });
});
