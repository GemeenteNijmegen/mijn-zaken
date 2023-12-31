import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { ApiGatewayV2Response, Response } from '@gemeentenijmegen/apigateway-http/lib/V2/Response';
import { AWS } from '@gemeentenijmegen/utils';
import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { OpenZaakClient } from './OpenZaakClient';
import { zakenRequestHandler } from './zakenRequestHandler';

const dynamoDBClient = new DynamoDBClient({ region: process.env.AWS_REGION });

let openZaakClient: OpenZaakClient | false;

async function initSecret() {
  if (!process.env.VIP_JWT_SECRET_ARN || !process.env.VIP_TAKEN_SECRET_ARN) {
    throw Error('No secret ARN provided');
  }
  return {
    vipSecret: await AWS.getSecret(process.env.VIP_JWT_SECRET_ARN),
    takenSecret: await AWS.getSecret(process.env.VIP_TAKEN_SECRET_ARN),
  };
}

const initPromise = initSecret();

function parseEvent(event: APIGatewayProxyEventV2): any {
  return {
    cookies: event?.cookies?.join(';'),
    zaak: event?.pathParameters?.zaak,
  };
}

export async function handler(event: any, _context: any):Promise<ApiGatewayV2Response> {
  if (!isAllowed()) {
    return Response.error(404);
  }
  try {
    const params = parseEvent(event);
    const secrets = await initPromise;
    const zakenClient = sharedOpenZaakClient(secrets.vipSecret);
    return await zakenRequestHandler(params.cookies, dynamoDBClient, { zakenClient, zaak: params.zaak, takenSecret: secrets.takenSecret });
  } catch (err) {
    console.debug(err);
    return Response.error(500);
  }
}

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

/** Check if this function is live */
function isAllowed() {
  if (process.env.IS_LIVE == 'true') {
    return true;
  }
  return false;
}
