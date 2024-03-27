import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { ApiGatewayV2Response, Response } from '@gemeentenijmegen/apigateway-http/lib/V2/Response';
import { AWS } from '@gemeentenijmegen/utils';
import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { Inzendingen } from './Inzendingen';
import { OpenZaakClient } from './OpenZaakClient';
import { ZaakAggregator } from './ZaakAggregator';
import { Zaken } from './Zaken';
import { zakenRequestHandler } from './zakenRequestHandler';

const dynamoDBClient = new DynamoDBClient({ region: process.env.AWS_REGION });

let openZaakClient: OpenZaakClient | false;
let zaken: Zaken | false;

async function initSecret() {
  if (!process.env.VIP_JWT_SECRET_ARN || !process.env.VIP_TAKEN_SECRET_ARN || !process.env.SUBMISSIONSTORAGE_SECRET_ARN) {
    throw Error('No secret ARN provided');
  }
  return {
    vipSecret: await AWS.getSecret(process.env.VIP_JWT_SECRET_ARN),
    takenSecret: await AWS.getSecret(process.env.VIP_TAKEN_SECRET_ARN),
    submissionstorageSecret: await AWS.getSecret(process.env.SUBMISSIONSTORAGE_SECRET_ARN),
  };
}

const initPromise = initSecret();

function parseEvent(event: APIGatewayProxyEventV2): { cookies: string; zaakId?: string; zaakConnectorId?: string; file?: string } {
  if (!event.cookies) {
    throw Error('no cookies in event');
  }
  return {
    zaakConnectorId: event?.pathParameters?.zaaksource,
    zaakId: event?.pathParameters?.zaakid,
    file: event?.pathParameters?.file,
    cookies: event.cookies.join(';'),
  };
}

export async function handler(event: any, _context: any):Promise<ApiGatewayV2Response> {
  if (!isAllowed()) {
    return Response.error(404);
  }
  try {
    const params = parseEvent(event);
    const secrets = await initPromise;
    const zaakAggregator = new ZaakAggregator({
      zaakConnectors: {
        zaken: await sharedZaken(secrets.vipSecret),
      },
    });
    const submissions = inzendingen(secrets.submissionstorageSecret);
    if (submissions) {
      zaakAggregator.addConnector('inzendingen', submissions);
    }
    inzendingen:
    return await zakenRequestHandler(params.cookies, dynamoDBClient, {
      zaakAggregator,
      zaken: await sharedZaken(secrets.vipSecret),
      inzendingen: submissions,
      zaak: params.zaakId,
      zaakConnectorId: params.zaakConnectorId,
      takenSecret: secrets.takenSecret,
      file: params.file,
    });
  } catch (err) {
    console.debug(err);
    return Response.error(500);
  }
}
/**
 * Setup the inzendingen-functionality, which retrieves
 * submissions from webformulieren-storage.
 *
 * @param accessKey API key for inzendingen api
 */
function inzendingen(accessKey: string) {
  if (process.env.SUBMISSIONSTORAGE_BASE_URL && process.env.SUBMISSIONS_LIVE == 'true') {
    return new Inzendingen({ baseUrl: process.env.SUBMISSIONSTORAGE_BASE_URL, accessKey });
  }
  return;
}

/**
 * Setup a ZGW-compatible client, which retrieves 'zaken'. This API
 * is very request-heavy, so we set up a 'shared' object, which caches
 * metadata (zaaktypen etc.) for the lifetime of the lambda.
 *
 * @param secret the JWT token secret for connecting to ZGW
 */
async function sharedZaken(secret: string) {
  const zakenClient = sharedOpenZaakClient(secret);
  if (!zaken) {
    zaken = new Zaken(zakenClient, { zaakConnectorId: 'zaak', show_documents: process.env.SHOW_DOCUMENTS == 'True' });
    await zaken.metaData();
    if (process.env.ALLOWED_ZAKEN_DOMAINS) {
      const domains = process.env.ALLOWED_ZAKEN_DOMAINS.split(',').map(domain => domain.trim());
      zaken.allowDomains(domains);
    }
  }
  return zaken;
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
