import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { zakenRequestHandler } from "../zakenRequestHandler";

describe('Request handler', () => {
  test('returns 200', async () => {
    return await zakenRequestHandler('', new DynamoDBClient({ region: process.env.AWS_REGION }));
  });
});
