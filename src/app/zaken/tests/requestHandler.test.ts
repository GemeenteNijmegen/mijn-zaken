import { writeFile } from 'fs';
import path from 'path';
import { DynamoDBClient, GetItemCommand, GetItemCommandOutput } from '@aws-sdk/client-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';
import axios from 'axios';
import * as dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { OpenZaakClient } from '../OpenZaakClient';
import { Zaken } from '../Zaken';
import { zakenRequestHandler } from '../zakenRequestHandler';
dotenv.config();

const ddbMock = mockClient(DynamoDBClient);
const getItemOutput: Partial<GetItemCommandOutput> = {
  Item: {
    data: {
      M: {
        loggedin: { BOOL: true },
        identifier: { S: '900026236' },
        user_type: { S: 'person' },
      },
    },
  },
};
ddbMock.on(GetItemCommand).resolves(getItemOutput);
const secret = process.env.VIP_JWT_SECRET ?? 'fakesecret';
process.env.VIP_TOKEN_BASE_URL = 'http://localhost';

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
const client = new OpenZaakClient({ baseUrl, axiosInstance });
const zaken = new Zaken(client);

describe('Request handler', () => {
  test('returns 200', async () => {

    const result = await zakenRequestHandler('session=12345', new DynamoDBClient({ region: process.env.AWS_REGION }), { zaken, takenSecret: 'test' });
    expect(result.statusCode).toBe(200);
    if (result.body) {
      try {
        writeFile(path.join(__dirname, 'output', 'test-zaken.html'), result.body, () => { });
      } catch (error) {
        console.debug(error);
      }
    }
  });

  test('returns 200 for organisation', async () => {
    const getItemOutputForOrganisation: Partial<GetItemCommandOutput> = {
      Item: {
        data: {
          M: {
            loggedin: { BOOL: true },
            identifier: { S: '69599084' },
            user_type: { S: 'organisation' },
          },
        },
      },
    };
    ddbMock.on(GetItemCommand).resolves(getItemOutputForOrganisation);

    const result = await zakenRequestHandler('session=12345', new DynamoDBClient({ region: process.env.AWS_REGION }), { zaken, takenSecret: 'test' });
    expect(result.statusCode).toBe(200);
  });
});


describe('Request handler single zaak', () => {
  test('returns 200', async () => {

    const result = await zakenRequestHandler('session=12345', new DynamoDBClient({ region: process.env.AWS_REGION }), { zaken, zaak: '5b1c4f8f-8c62-41ac-a3a0-e2ac08b6e886', takenSecret: 'test' });
    expect(result.statusCode).toBe(200);
    if (result.body) {
      try {
        writeFile(path.join(__dirname, 'output', 'test.html'), result.body, () => { });
      } catch (error) {
        console.debug(error);
      }
    }
  });

});
