import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { Response } from '@gemeentenijmegen/apigateway-http/lib/V2/Response';
import { Session } from '@gemeentenijmegen/session';
import * as template from './templates/zaken.mustache';
import { render } from '../../shared/render';

export async function zakenRequestHandler(cookies: string, dynamoDBClient: DynamoDBClient) {

  console.time('request');
  console.timeLog('request', 'start request');
  console.timeLog('request', 'finished init');

  let session = new Session(cookies, dynamoDBClient);
  await session.init();

  console.timeLog('request', 'init session');
  if (session.isLoggedIn() == true) {
    const response = await handleLoggedinRequest(session);
    console.timeEnd('request');
    return response;
  }

  console.timeEnd('request');
  return Response.redirect('/login');
}

async function handleLoggedinRequest(session: Session) {

  console.timeLog('request', 'Api Client init');
  console.timeLog('request', 'Brp Api');

  const data = {
    volledigenaam: session.getValue('username'),
    title: 'Lopende zaken',
    shownav: true,
  };

  // render page
  const html = await render(data, template.default);
  return Response.html(html, 200, session.getCookie());
}

