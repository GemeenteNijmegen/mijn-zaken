import { writeFile } from 'fs';
import path from 'path';
import { DynamoDBClient, GetItemCommandOutput } from '@aws-sdk/client-dynamodb';
import axios from 'axios';
import * as dotenv from 'dotenv';
import { mockClient } from 'jest-aws-client-mock';
import jwt from 'jsonwebtoken';
import { OpenZaakClient } from '../OpenZaakClient';
import { zakenRequestHandler } from '../zakenRequestHandler';
dotenv.config();

const ddbMock = mockClient(DynamoDBClient);
const getItemOutput: Partial<GetItemCommandOutput> = {
  Item: {
    data: {
      M: {
        loggedin: { BOOL: true },
        bsn: { S: '900026236' },
      },
    },
  },
};
ddbMock.mockImplementation(() => getItemOutput);
const secret = process.env.VIP_JWT_SECRET ?? 'fakesecret';
let baseUrl = new URL('http://localhost');
if (process.env.VIP_BASE_URL) {
  baseUrl = new URL(process.env.VIP_BASE_URL);
}

const token = jwt.sign({
  iss: process.env.VIP_JWT_CLIENT_ID,
  iat: Date.now(),
  client_id: process.env.VIP_JWT_CLIENT_ID,
  user_id: process.env.VIP_JWT_USER_ID,
  user_representation: process.env.VIP_JWT_USER_ID,
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
console.debug(baseUrl);
const client = new OpenZaakClient({ baseUrl, axiosInstance });

describe('Request handler', () => {
  test('returns 200', async () => {

    const result = await zakenRequestHandler('session=12345', new DynamoDBClient({ region: process.env.AWS_REGION }), { zakenClient: client });
    expect(result.statusCode).toBe(200);
    if (result.body) {
      console.debug('writing file');
      try {
        writeFile(path.join(__dirname, 'output', 'test.html'), result.body, () => { });
      } catch (error) {
        console.debug(error);
      }
    }
  });
});
