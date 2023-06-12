import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { ApiGatewayV2Response, Response } from '@gemeentenijmegen/apigateway-http/lib/V2/Response';
import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { zakenRequestHandler } from './zakenRequestHandler';

const dynamoDBClient = new DynamoDBClient({ region: process.env.AWS_REGION });
// const apiClient = new ApiClient();

// async function init() {
//   console.time('init');
//   console.timeLog('init', 'start init');
//   let promise = apiClient.init();
//   console.timeEnd('init');
//   return promise;
// }

// const initPromise = init();

function parseEvent(event: APIGatewayProxyEventV2): any {
  return {
    cookies: event?.cookies?.join(';'),
  };
}

export async function handler(event: any, _context: any):Promise<ApiGatewayV2Response> {
  try {
    const params = parseEvent(event);
    // await initPromise;
    return await zakenRequestHandler(params.cookies, dynamoDBClient);

  } catch (err) {
    console.debug(err);
    return Response.error(500);
  }
};