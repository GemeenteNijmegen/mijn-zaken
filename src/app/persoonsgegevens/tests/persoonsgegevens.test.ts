import * as fs from 'fs';
import * as path from 'path';
import { DynamoDBClient, GetItemCommandOutput } from '@aws-sdk/client-dynamodb';
import { SecretsManagerClient, GetSecretValueCommandOutput } from '@aws-sdk/client-secrets-manager';
import { SSMClient, GetParameterCommandOutput } from '@aws-sdk/client-ssm';
import { ApiClient } from '@gemeentenijmegen/apiclient';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { mockClient } from 'jest-aws-client-mock';
import { persoonsgegevensRequestHandler } from '../persoonsgegevensRequestHandler';


if (process.env.VERBOSETESTS!='True') {
  global.console.error = jest.fn();
  global.console.time = jest.fn();
  global.console.log = jest.fn();
}

beforeAll(() => {
  global.console.log = jest.fn();
  // Set env variables
  process.env.SESSION_TABLE = 'mijnnijmegen-sessions';
  process.env.AUTH_URL_BASE = 'https://authenticatie-accp.nijmegen.nl';
  process.env.APPLICATION_URL_BASE = 'https://testing.example.com/';
  process.env.CLIENT_SECRET_ARN = '123';
  process.env.OIDC_CLIENT_ID = '1234';
  process.env.OIDC_SCOPE = 'openid';
  process.env.BRP_API_URL = 'https://localhost/brp';

  process.env.MTLS_PRIVATE_KEY_ARN = 'testarn';

  const secretsOutput: GetSecretValueCommandOutput = {
    $metadata: {},
    SecretString: 'test',
  };
  secretsMock.mockImplementation(() => secretsOutput);
  const ssmOutput: GetParameterCommandOutput = {
    $metadata: {},
    Parameter: {
      Value: 'test',
    },
  };

  secretsMock.mockImplementation(() => secretsOutput);
  parameterStoreMock.mockImplementation(() => ssmOutput);
});


const ddbMock = mockClient(DynamoDBClient);
const secretsMock = mockClient(SecretsManagerClient);
const axiosMock = new MockAdapter(axios);
const parameterStoreMock = mockClient(SSMClient);

beforeEach(() => {
  ddbMock.mockReset();
  secretsMock.mockReset();
  axiosMock.reset();
  const getItemOutput: Partial<GetItemCommandOutput> = {
    Item: {
      data: {
        M: {
          loggedin: { BOOL: true },
          bsn: { S: '999993653' },
        },
      },
    },
  };
  ddbMock.mockImplementation(() => getItemOutput);
});

describe('Requests', () => {
  const apiClient = new ApiClient('', '', '');
  const dynamoDBClient = new DynamoDBClient({});
  test('Return status 200', async () => {
    const output: GetSecretValueCommandOutput = {
      $metadata: {},
      SecretString: 'ditiseennepgeheim',
    };
    secretsMock.mockImplementation(() => output);
    const file = 'brp-999993653.json';
    const filePath = path.join('responses', file);
    const returnData = await getStringFromFilePath(filePath)
      .then((data: any) => {
        return JSON.parse(data);
      });
    axiosMock.onPost().reply(200, returnData);


    const result = await persoonsgegevensRequestHandler('session=12345', apiClient, dynamoDBClient);
    expect(result.statusCode).toBe(200);
  });

  test('Return error page', async () => {
    const output: GetSecretValueCommandOutput = {
      $metadata: {},
      SecretString: 'ditiseennepgeheim',
    };
    secretsMock.mockImplementation(() => output);
    axiosMock.onPost().reply(200, {
    });


    const result = await persoonsgegevensRequestHandler('session=12345', apiClient, dynamoDBClient);
    expect(result.statusCode).toBe(200);
  });

  test('Return error page on timeout', async () => {
    const output: GetSecretValueCommandOutput = {
      $metadata: {},
      SecretString: 'ditiseennepgeheim',
    };
    secretsMock.mockImplementation(() => output);
    axiosMock.onPost().timeout();


    const result = await persoonsgegevensRequestHandler('session=12345', apiClient, dynamoDBClient);
    expect(result.statusCode).toBe(200);
  });


  test('Show overview page', async () => {
    const output: GetSecretValueCommandOutput = {
      $metadata: {},
      SecretString: 'ditiseennepgeheim',
    };
    secretsMock.mockImplementation(() => output);
    const file = 'brp-999993653.json';
    const filePath = path.join('responses', file);
    const returnData = await getStringFromFilePath(filePath)
      .then((data: any) => {
        return JSON.parse(data);
      });
    axiosMock.onPost().reply(200, returnData);
    const result = await persoonsgegevensRequestHandler('session=12345', apiClient, dynamoDBClient);
    expect(result.body).toMatch('Mijn gegevens');
  });
});


describe('Unexpected requests', () => {
  test('No cookies set should redirect to login page', async() => {
    const client = new ApiClient('test', 'test', 'test');
    const dynamoDBClient = new DynamoDBClient({ region: 'eu-west-1' });

    const result = await persoonsgegevensRequestHandler('', client, dynamoDBClient);
    expect(result.statusCode).toBe(302);
    expect(result.headers?.Location).toMatch('/login');
  });
});

async function getStringFromFilePath(filePath: string) {
  return new Promise((res, rej) => {
    fs.readFile(path.join(__dirname, filePath), (err, data) => {
      if (err) {return rej(err);}
      return res(data.toString());
    });
  });
}