import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import takenByZaak from './samples/taken-by-zaak.json';
import { OpenZaakClient } from '../OpenZaakClient';
import { Taken } from '../Taken';
const instance = axios.create(
  {
    headers: {
      Authorization: 'Token test',
    },
  },
);
const axiosMock = new MockAdapter(instance);
let baseUrl = new URL('http://localhost');

beforeAll(() => {
  axiosMock.onGet().reply(200, takenByZaak);
});

describe('Taken tests', () => {
  test('constructor succeeds', async () => {
    expect(() => {
      const client = new OpenZaakClient({ baseUrl, axiosInstance: axios });
      new Taken(client);
    }).not.toThrow();
  });

  test('Getting taken by zaakId returns results', async() => {
    const client = new OpenZaakClient({ baseUrl, axiosInstance: instance });
    const taken = new Taken(client);
    const takenForZaak = await taken.get('testZaak');
    expect(takenForZaak.results).toHaveLength(4);
  });
});