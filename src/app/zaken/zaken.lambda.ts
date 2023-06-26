import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { ApiGatewayV2Response, Response } from '@gemeentenijmegen/apigateway-http/lib/V2/Response';
import { AWS } from '@gemeentenijmegen/utils';
import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { OpenZaakClient } from './OpenZaakClient';
import { zakenRequestHandler } from './zakenRequestHandler';

const dynamoDBClient = new DynamoDBClient({ region: process.env.AWS_REGION });

let openZaakClient: OpenZaakClient | false;

async function initSecret() {
  if (!process.env.VIP_JWT_SECRET_ARN) {
    throw Error('No secret ARN provided');
  }
  return AWS.getSecret(process.env.VIP_JWT_SECRET_ARN);
}

const initPromise = initSecret();

function parseEvent(event: APIGatewayProxyEventV2): any {
  return {
    cookies: event?.cookies?.join(';'),
    zaak: event?.queryStringParameters?.zaak,
  };
}

export async function handler(event: any, _context: any):Promise<ApiGatewayV2Response> {
  try {
    const params = parseEvent(event);
    const secret = await initPromise;
    const zakenClient = sharedOpenZaakClient(secret);
    return await zakenRequestHandler(params.cookies, dynamoDBClient, { zakenClient });
  } catch (err) {
    console.debug(err);
    return Response.error(500);
  }
};

function sharedOpenZaakClient(secret: string): OpenZaakClient {
  if (!openZaakClient) {
    if (!process.env.VIP_BASE_URL) {
      throw Error('no base url set');
    }
    openZaakClient = new OpenZaakClient({
      baseUrl: new URL(process.env.VIP_BASE_URL),
      clientId: process.env.VIP_JWT_CLIENT_ID,
      userId: process.env.VIP_JWT_USER_ID,
      secret,
    });
  }
  return openZaakClient;
}
