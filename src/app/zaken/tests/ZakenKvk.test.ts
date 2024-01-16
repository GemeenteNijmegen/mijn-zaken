import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import catalogi from './samples/catalogi.json';
import enkelvoudiginformatiobject from './samples/enkelvoudiginformatieobject.json';
import resultaattypen from './samples/resultaattypen.json';
import resultaatvoorbeeld from './samples/resultaatvoorbeeld.json';
import rollen from './samples/rollen.json';
import statustypen from './samples/statustypen.json';
import statusvoorbeeld from './samples/statusvoorbeeld.json';
import statusvoorbeeld2 from './samples/statusvoorbeeld2.json';
import zaak1 from './samples/zaak1.json';
import zaak2 from './samples/zaak2.json';
import zaak1noStatus from './samples/zaak1noStatus.json';
import zaakinformatieobjecten from './samples/zaakinformatieobjecten.json';
import zaaktypen from './samples/zaaktypen.json';
import { OpenZaakClient } from '../OpenZaakClient';
import { Zaken } from '../Zaken';
import { Organisation } from '../User';

let baseUrl = '/';
const axiosMock = new MockAdapter(axios);

beforeAll(() => {
  axiosMock.onGet('/catalogi/api/v1/zaaktypen').reply(200, zaaktypen);
  axiosMock.onGet('/catalogi/api/v1/statustypen').reply(200, statustypen);
  axiosMock.onGet('/catalogi/api/v1/resultaattypen').reply(200, resultaattypen);
  axiosMock.onGet('/catalogi/api/v1/catalogussen').reply(200, catalogi);
  axiosMock.onGet(/\/zaken\/api\/v1\/rollen\?betrokkeneIdentificatie__nietNatuurlijkPersoon__annIdentificatie=.+/).reply(200, rollen);
  axiosMock.onGet('/zaken/api/v1/zaken/5b1c4f8f-8c62-41ac-a3a0-e2ac08b6e886').reply(200, zaak1);
  axiosMock.onGet('/zaken/api/v1/zaken/3720dbc1-6a94-411e-b651-0aeb67330064').reply(200, zaak2);
  axiosMock.onGet('/zaken/api/v1/zaken/noStatus').reply(200, zaak1noStatus);
  axiosMock.onGet('/zaken/api/v1/statussen/9f14d7b0-8f00-4827-9b99-d77ae5d8d155').reply(200, statusvoorbeeld);
  axiosMock.onGet(/\/zaken\/api\/v1\/statussen\/.+/).reply(200, statusvoorbeeld2);
  axiosMock.onGet(/\/zaken\/api\/v1\/resultaten\/.+/).reply(200, resultaatvoorbeeld);
  axiosMock.onGet(/\/zaken\/api\/v1\/zaakinformatieobjecten.+/).reply(200, zaakinformatieobjecten);
  axiosMock.onGet(/\/documenten\/api\/v1\/enkelvoudiginformatieobjecten.+/).reply(200, enkelvoudiginformatiobject);
});

describe('Zaken', () => {
  const user = new Organisation('12345678');
  const client = new OpenZaakClient({ baseUrl, axiosInstance: axios });
  test('zaken are processed correctly', async () => {
    const statusResults = new Zaken(client, user);
    const results = await statusResults.list();
    expect(results).toStrictEqual({
      open: [
        {
          id: 'Z23.001592',
          registratiedatum: '9 juni 2023',
          verwachtte_einddatum: '1 september 2023',
          einddatum: null,
          uiterlijke_einddatum: '11 oktober 2023',
          resultaat: null,
          status: 'In behandeling',
          uuid: '5b1c4f8f-8c62-41ac-a3a0-e2ac08b6e886',
          zaak_type: 'Bezwaar',
        },
      ],
      gesloten: [
        {
          id: 'Z23.001438',
          registratiedatum: '30 maart 2023',
          einddatum: '28 maart 2023',
          verwachtte_einddatum: '20 juni 2023',
          uiterlijke_einddatum: '11 juni 2023',
          resultaat: 'Ingetrokken na BIA',
          status: 'In behandeling',
          uuid: '3720dbc1-6a94-411e-b651-0aeb67330064',
          zaak_type: 'Klacht',
        },
      ],
    });
  });

  test('a single zaak is processed correctly',
    async () => {
      const statusResults = new Zaken(client, user);
      const results = await statusResults.get('5b1c4f8f-8c62-41ac-a3a0-e2ac08b6e886');
      expect(results).toStrictEqual(
        {
          id: 'Z23.001592',
          registratiedatum: '9 juni 2023',
          verwachtte_einddatum: '1 september 2023',
          einddatum: null,
          uiterlijke_einddatum: '11 oktober 2023',
          resultaat: null,
          status: 'In behandeling',
          uuid: '5b1c4f8f-8c62-41ac-a3a0-e2ac08b6e886',
          zaak_type: 'Bezwaar',
          status_list: [
            {
              name: 'Ontvangen',
              current: false,
              completed: true,
              is_eind: false,
              volgnummer: 1,
            },
            {
              name: 'In behandeling',
              current: true,
              is_eind: false,
              completed: false,
              volgnummer: 2,
            },
            {
              name: 'Afgerond',
              current: false,
              completed: false,
              is_eind: true,
              volgnummer: 3,
            },
          ],
          documenten: null,
          has_documenten: false,
          taken: null,
          has_taken: false,
        });
    });

});
