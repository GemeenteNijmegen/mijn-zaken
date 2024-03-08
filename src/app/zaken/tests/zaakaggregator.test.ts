import { Bsn } from '@gemeentenijmegen/utils';
import axios from 'axios';
import { OpenZaakClient } from '../OpenZaakClient';
import { Person } from '../User';
import { ZaakAggregator } from '../ZaakAggregator';
import { Zaken } from '../Zaken';

const sampleDate = new Date();
const mockedZakenList = {
  open: [
    {
      identifier: '123',
      internal_id: 'hiereneuuid',
      registratiedatum: sampleDate,
      verwachtte_einddatum: sampleDate,
      uiterlijke_einddatum: sampleDate,
      einddatum: sampleDate,
      zaak_type: 'zaaktype1',
      status: 'gesloten',
      resultaat: 'geen',
    },
  ],
  gesloten: [],
};
jest.mock('../Zaken', () => {
  return {
    Zaken: jest.fn(() => {
      return {
        list: jest.fn().mockResolvedValue(mockedZakenList),
      };
    }),
  };


},

);
let baseUrl = new URL('http://localhost');
const person = new Person(new Bsn('900222670'));
const client = new OpenZaakClient({ baseUrl, axiosInstance: axios });
describe('Zaakaggregator returns combined zaken', () => {
  test('Zaakaggregator results in summaries useful for listing', async() => {
    const aggregator = new ZaakAggregator({ zaken: new Zaken(client) });
    expect(await aggregator.list(person)).toBe(mockedZakenList);
  });
});
