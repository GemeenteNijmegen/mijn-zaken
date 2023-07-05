import { Bsn } from '@gemeentenijmegen/utils';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import resultaattypen from './samples/resultaattypen.json';
import resultaatvoorbeeld from './samples/resultaatvoorbeeld.json';
import rol from './samples/rol.json';
import statustypen from './samples/statustypen.json';
import statusvoorbeeld from './samples/statusvoorbeeld.json';
import statusvoorbeeld2 from './samples/statusvoorbeeld2.json';
import zaak1 from './samples/zaak1.json';
import zaaktypen from './samples/zaaktypen.json';
import zaken from './samples/zaken.json';
import { OpenZaakClient } from '../OpenZaakClient';
import { Zaken } from '../Zaken';

let baseUrl = new URL('http://localhost');
if (process.env.VIP_BASE_URL) {
  baseUrl = new URL(process.env.VIP_BASE_URL);
}

describe('Zaken', () => {
  test('constructing object succeeds', async () => {
    const axiosMock = new MockAdapter(axios);
    axiosMock.onGet().reply(200, []);
    const client = new OpenZaakClient({ baseUrl, axiosInstance: axios });
    expect(() => { new Zaken(client, new Bsn('900222670')); }).not.toThrow();
  });

  test('zaken are processed correctly', async () => {
    const bsn = new Bsn('900026236');
    const axiosMock = new MockAdapter(axios);
    axiosMock.onGet('/catalogi/api/v1/zaaktypen').reply(200, zaaktypen);
    axiosMock.onGet('/catalogi/api/v1/statustypen').reply(200, statustypen);
    axiosMock.onGet('/catalogi/api/v1/resultaattypen').reply(200, resultaattypen);
    axiosMock.onGet(`/zaken/api/v1/zaken?rol__betrokkeneIdentificatie__natuurlijkPersoon__inpBsn=${bsn.bsn}&ordering=-startdatum&page=1`).reply(200, zaken);
    axiosMock.onGet('/zaken/api/v1/statussen/9f14d7b0-8f00-4827-9b99-d77ae5d8d155').reply(200, statusvoorbeeld);
    axiosMock.onGet(/\/zaken\/api\/v1\/statussen\/.+/).reply(200, statusvoorbeeld2);
    axiosMock.onGet(/\/zaken\/api\/v1\/resultaten\/.+/).reply(200, resultaatvoorbeeld);
    const client = new OpenZaakClient({ baseUrl, axiosInstance: axios });
    const statusResults = new Zaken(client, bsn);
    const results = await statusResults.list();
    console.debug(results);
    expect(results).toStrictEqual({
      open: [
        {
          id: 'Z23.001592',
          registratiedatum: '9 juni 2023',
          resultaat: null,
          status: 'Ontvangen',
          uuid: '5b1c4f8f-8c62-41ac-a3a0-e2ac08b6e886',
          zaak_type: 'Bezwaar',
        },
      ],
      gesloten: [
        {
          id: 'Z23.001438',
          registratiedatum: '30 maart 2023',
          resultaat: 'Ingetrokken na BIA',
          status: 'Ontvangen',
          uuid: '3720dbc1-6a94-411e-b651-0aeb67330064',
          zaak_type: 'Klacht',
        },
      ],
    });
  });

  test('a single zaak is processed correctly',
    async () => {
      const bsn = new Bsn('900026236');
      const axiosMock = new MockAdapter(axios);
      axiosMock.onGet('/catalogi/api/v1/zaaktypen').reply(200,
        zaaktypen);
      axiosMock.onGet('/catalogi/api/v1/statustypen').reply(200, statustypen);
      axiosMock.onGet('/catalogi/api/v1/resultaattypen').reply(200, resultaattypen);
      axiosMock.onGet('/zaken/api/v1/zaken/5b1c4f8f-8c62-41ac-a3a0-e2ac08b6e886').reply(200, zaak1);
      axiosMock.onGet('/zaken/api/v1/statussen/9f14d7b0-8f00-4827-9b99-d77ae5d8d155').reply(200, statusvoorbeeld);
      axiosMock.onGet(/\/zaken\/api\/v1\/statussen\/.+/).reply(200, statusvoorbeeld2);
      axiosMock.onGet(/\/zaken\/api\/v1\/resultaten\/.+/).reply(200, resultaatvoorbeeld);
      axiosMock.onGet(/\/zaken\/api\/v1\/rollen.+/).reply(200, rol);
      const client = new OpenZaakClient({ baseUrl, axiosInstance: axios });
      const ZakenResults = new Zaken(client, bsn);
      const results = await ZakenResults.get('5b1c4f8f-8c62-41ac-a3a0-e2ac08b6e886');
      expect(results).toStrictEqual(
        {
          id: 'Z23.001592',
          registratiedatum: '9 juni 2023',
          resultaat: null,
          status: 'Ontvangen',
          uuid: '5b1c4f8f-8c62-41ac-a3a0-e2ac08b6e886',
          zaak_type: 'Bezwaar',
          status_list: [
            {
              name: 'Ontvangen',
              current: true,
              is_eind: false,
              volgnummer: 1,
            },
            {
              name: 'In behandeling',
              current: false,
              is_eind: false,
              volgnummer: 2,
            },
            {
              name: 'Afgerond',
              current: false,
              is_eind: true,
              volgnummer: 3,
            },
          ],
        });
    });

  test('a single zaak has several statusses, which are available in the zaak', async () => {
    const bsn = new Bsn('900026236');
    const axiosMock = new MockAdapter(axios);
    axiosMock.onGet('/catalogi/api/v1/zaaktypen').reply(200, zaaktypen);
    axiosMock.onGet('/catalogi/api/v1/statustypen').reply(200, statustypen);
    axiosMock.onGet('/catalogi/api/v1/resultaattypen').reply(200, resultaattypen);
    axiosMock.onGet('/zaken/api/v1/zaken/5b1c4f8f-8c62-41ac-a3a0-e2ac08b6e886').reply(200, zaak1);
    axiosMock.onGet('/zaken/api/v1/statussen/9f14d7b0-8f00-4827-9b99-d77ae5d8d155').reply(200, statusvoorbeeld);
    axiosMock.onGet(/\/zaken\/api\/v1\/statussen\/.+/).reply(200, statusvoorbeeld2);
    axiosMock.onGet(/\/zaken\/api\/v1\/resultaten\/.+/).reply(200, resultaatvoorbeeld);
    axiosMock.onGet(/\/zaken\/api\/v1\/rollen.+/).reply(200, rol);
    const client = new OpenZaakClient({ baseUrl, axiosInstance: axios });
    const ZakenResults = new Zaken(client, bsn);
    const results = await ZakenResults.get('5b1c4f8f-8c62-41ac-a3a0-e2ac08b6e886');
    expect(results).toStrictEqual({
      id: 'Z23.001592',
      registratiedatum: '9 juni 2023',
      resultaat: null,
      status: 'Ontvangen',
      status_list: [
        {
          name: 'Ontvangen',
          current: true,
          is_eind: false,
          volgnummer: 1,
        },
        {
          name: 'In behandeling',
          current: false,
          is_eind: false,
          volgnummer: 2,
        },
        {
          name: 'Afgerond',
          current: false,
          is_eind: true,
          volgnummer: 3,
        },
      ],
      uuid: '5b1c4f8f-8c62-41ac-a3a0-e2ac08b6e886',
      zaak_type: 'Bezwaar',
    });
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
