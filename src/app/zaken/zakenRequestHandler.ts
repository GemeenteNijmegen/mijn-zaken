import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { Response } from '@gemeentenijmegen/apigateway-http/lib/V2/Response';
import { Session } from '@gemeentenijmegen/session';
import * as voorbeeldZaak1 from './templates/voorbeeldzaak1.mustache';
import * as voorbeeldZaak2 from './templates/voorbeeldzaak2.mustache';
import * as template from './templates/zaken.mustache';
import { render } from '../../shared/render';

export async function zakenRequestHandler(params: any, dynamoDBClient: DynamoDBClient) {

  console.time('request');
  console.timeLog('request', 'start request');
  console.timeLog('request', 'finished init');

  let session = new Session(params.cookies, dynamoDBClient);
  await session.init();

  console.timeLog('request', 'init session');
  if (session.isLoggedIn() == true) {
    const response = await handleLoggedinRequest(session, params);
    console.timeEnd('request');
    return response;
  }

  console.timeEnd('request');
  return Response.redirect('/login');
}

async function handleLoggedinRequest(session: Session, params: any) {

  console.timeLog('request', 'Api Client init');
  console.timeLog('request', 'Brp Api');

  const data = {
    volledigenaam: session.getValue('username'),
    title: 'Lopende zaken',
    shownav: true,
  };

  let t = template.default;
  if (params.zaak == '1') {
    t = voorbeeldZaak1.default;
  } else if (params.zaak == '2') {
    t = voorbeeldZaak2.default;
  }

  // render page
  const html = await render(data, t);
  return Response.html(html, 200, session.getCookie());
}

