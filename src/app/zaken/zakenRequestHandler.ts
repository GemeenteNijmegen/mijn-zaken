import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { Response } from '@gemeentenijmegen/apigateway-http/lib/V2/Response';
import { Session } from '@gemeentenijmegen/session';
import { Bsn } from '@gemeentenijmegen/utils';
import { OpenZaakClient } from './OpenZaakClient';
import * as zaakTemplate from './templates/zaak.mustache';
import * as zakenTemplate from './templates/zaken.mustache';
import { Zaken } from './Zaken';
import { render } from '../../shared/render';

export async function zakenRequestHandler(cookies: string, dynamoDBClient: DynamoDBClient, config: { zakenClient: OpenZaakClient; zaak?: string }) {

  console.time('request');
  console.timeLog('request', 'start request');
  console.timeLog('request', 'finished init');

  let session = new Session(cookies, dynamoDBClient);
  await session.init();

  console.timeLog('request', 'init session');
  if (session.isLoggedIn() == true) {
    try {
      let response;
      if (config.zaak) {
        response = await singleZaakRequest(session, config.zakenClient, config.zaak);
      }
      response = await listZakenRequest(session, config.zakenClient);
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

async function listZakenRequest(session: Session, client: OpenZaakClient) {

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
  const html = await render(data, zakenTemplate.default);
  return Response.html(html, 200, session.getCookie());
}


async function singleZaakRequest(session: Session, client: OpenZaakClient, zaak: string) {

  console.timeLog('request', 'Api Client init');

  let data = {
    volledigenaam: session.getValue('username'),
    title: 'Zaak',
    shownav: true,
    zaak: <any>null,
  };

  const bsn = new Bsn(session.getValue('bsn'));
  const statuses = new Zaken(client, bsn);
  data.zaak = await statuses.get(zaak);
  console.timeLog('request', 'zaak received');

  // render page
  const html = await render(data, zaakTemplate.default);
  return Response.html(html, 200, session.getCookie());
}

