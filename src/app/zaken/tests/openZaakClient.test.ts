import axios from 'axios';
import * as dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { OpenZaakClient } from '../OpenZaakClient';
dotenv.config();

const secret = process.env.VIP_JWT_SECRET;
let baseUrl = new URL('http://localhost');
if (process.env.VIP_BASE_URL) {
  baseUrl = new URL(process.env.VIP_BASE_URL);
}

describe('Openzaak Client', () => {
  test('does successful live requests with provided instance', async () => {
    if (!secret) {
      console.debug('Secret must be provided for live test, skipping');
      return;
    }
    const token = jwt.sign({
      iss: process.env.VIP_CLIENT_ID,
      iat: Date.now(),
      client_id: process.env.VIP_CLIENT_ID,
      user_id: process.env.VIP_USER_ID,
      user_representation: process.env.VIP_USER_ID,
    }, secret);

    const axiosInstance = axios.create(
      {
        baseURL: baseUrl.toString(),
        headers: {
          'Authorization': 'Bearer ' + token,
          'Accept-Crs': 'EPSG:4326',
          'Content-Crs': 'EPSG:4326',
        },
      });
    const client = new OpenZaakClient({ baseUrl, axiosInstance });

    const res = await client.request('/catalogi/api/v1/zaaktypen');
    expect(res).toHaveProperty('results');
  });
  test('does successful live requests with provided config', async () => {
    if (!secret) {
      console.debug('Secret must be provided for live test, skipping');
      return;
    }
    const client = new OpenZaakClient({ baseUrl, clientId: process.env.VIP_CLIENT_ID, userId: process.env.VIP_USER_ID, secret });
    const res = await client.request('/catalogi/api/v1/zaaktypen');
    expect(res).toHaveProperty('results');
  });

  test('not providing an instance or config throws', async () => {
    expect(() => {
      new OpenZaakClient({ baseUrl });
    }).toThrow();
  });

  test('providing config does not throw', async () => {
    expect(() => {
      new OpenZaakClient({ baseUrl, clientId: 'test', userId: 'testUser', secret: 'demoSecret' });
    }).not.toThrow();
  });

  /**
   * Be careful, the provided instance in this test is not usable to actually do API calls.
   */
  test('providing axios object does not throw', async () => {
    expect(() => {
      const axiosInstance = axios.create(
        {
          baseURL: 'process.env.VIP_BASE_URL',
        });
      new OpenZaakClient({ baseUrl, axiosInstance });
    }).not.toThrow();
  });
});
