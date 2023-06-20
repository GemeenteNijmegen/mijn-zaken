import axios from "axios";
import jwt from "jsonwebtoken";
import { OpenZaakClient } from "../OpenZaakClient";
import * as dotenv from 'dotenv';
dotenv.config()

const secret = process.env.SECRET;

describe('Openzaak Client', () => {
  test('does successful live requests with provided instance', async () => {
    if(!secret) { console.debug('Secret must be provided for live test, skipping'); return; }
    const token = jwt.sign({
      iss: process.env.CLIENT_ID,
      iat: Date.now(),
      client_id: process.env.CLIENT_ID,
      user_id: process.env.USER_ID,
      user_representation: process.env.USER_ID
    }, secret);

    const axiosInstance = axios.create(
      {
        baseURL: 'https://openzaak.woweb.app',
        headers: {
          "Authorization": "Bearer " + token,
          "Accept-Crs": "EPSG:4326",
          "Content-Crs": "EPSG:4326"
        }
      });
    const client = new OpenZaakClient({ baseUrl: new URL('https://openzaak.woweb.app'), axiosInstance });

    const res = await client.request('/catalogi/api/v1/zaaktypen');
    expect(res).toHaveProperty('results');
  });
  test('does successful live requests with provided config', async () => {
    const client = new OpenZaakClient({ baseUrl: new URL('https://openzaak.woweb.app'), clientId: process.env.CLIENT_ID, userId: process.env.USER_ID, secret });
    const res = await client.request('/catalogi/api/v1/zaaktypen');
    expect(res).toHaveProperty('results');
  });

  test('not providing an instance or config throws', async () => {
    expect(() => {
      new OpenZaakClient({ baseUrl: new URL('https://openzaak.woweb.app'), });
    }).toThrow();
  });

  test('providing config does not throw', async () => {
    expect(() => {
      new OpenZaakClient({ baseUrl: new URL('https://openzaak.woweb.app'),  clientId: 'test', userId: 'testUser', secret: 'demoSecret'});
    }).not.toThrow();
  });

  /**
   * Be careful, the provided instance in this test is not usable to actually do API calls.
   */
  test('providing axios object does not throw', async () => {
    expect(() => {
      const axiosInstance = axios.create(
      {
          baseURL: 'https://openzaak.woweb.app',
      });
      new OpenZaakClient({ baseUrl: new URL('https://openzaak.woweb.app'), axiosInstance });
    }).not.toThrow();
  });
});
