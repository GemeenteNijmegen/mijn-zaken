import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { Response } from '@gemeentenijmegen/apigateway-http/lib/V2/Response';
import { Session } from '@gemeentenijmegen/session';
import { OpenZaakClient } from './OpenZaakClient';
import { Statuses } from './Statuses';
import * as template from './templates/zaken.mustache';
import { render } from '../../shared/render';

export async function zakenRequestHandler(cookies: string, dynamoDBClient: DynamoDBClient, config: { zakenClient: OpenZaakClient }) {

  console.time('request');
  console.timeLog('request', 'start request');
  console.timeLog('request', 'finished init');

  let session = new Session(cookies, dynamoDBClient);
  await session.init();

  console.timeLog('request', 'init session');
  if (session.isLoggedIn() == true) {
    const response = await handleLoggedinRequest(session, config.zakenClient);
    console.timeEnd('request');
    return response;
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

  const statuses = new Statuses(client);
  const zaken = await statuses.list();
  data.zaken = zaken;
  console.timeLog('request', 'zaken received');

  // render page
  const html = await render(data, template.default);
  return Response.html(html, 200, session.getCookie());
}

