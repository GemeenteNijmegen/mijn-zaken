import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { Response } from '@gemeentenijmegen/apigateway-http/lib/V2/Response';
import { Session } from '@gemeentenijmegen/session';
import { Bsn } from '@gemeentenijmegen/utils';
import { OpenZaakClient } from './OpenZaakClient';
import * as template from './templates/zaken.mustache';
import { Zaken } from './Zaken';
import { render } from '../../shared/render';

export async function zakenRequestHandler(cookies: string, dynamoDBClient: DynamoDBClient, config: { zakenClient: OpenZaakClient }) {

  console.time('request');
  console.timeLog('request', 'start request');
  console.timeLog('request', 'finished init');

  let session = new Session(cookies, dynamoDBClient);
  await session.init();

  console.timeLog('request', 'init session');
  if (session.isLoggedIn() == true) {
    try {
      const response = await handleLoggedinRequest(session, config.zakenClient);
      console.timeEnd('request');
      return response;
    } catch (error: any) {
      console.error(error);
      return Response.error(500);
    }
  }

  console.timeEnd('request');
  return Response.redirect('/login');
}

async function handleLoggedinRequest(session: Session, client: OpenZaakClient) {

  console.timeLog('request', 'Api Client init');

  let data = {
    volledigenaam: session.getValue('username'),
    title: 'Lopende zaken',
    shownav: true,
    zaken: <any>[],
  };

  const bsn = new Bsn(session.getValue('bsn'));
  const statuses = new Zaken(client, bsn);
  const zaken = await statuses.list();
  data.zaken = zaken;
  console.timeLog('request', 'zaken received');

  // render page
  const html = await render(data, template.default);
  return Response.html(html, 200, session.getCookie());
}

