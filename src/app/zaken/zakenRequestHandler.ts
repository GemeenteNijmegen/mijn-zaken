import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { Response } from '@gemeentenijmegen/apigateway-http/lib/V2/Response';
import { Session } from '@gemeentenijmegen/session';
import { Bsn } from '@gemeentenijmegen/utils';
import axios from 'axios';
import { OpenZaakClient } from './OpenZaakClient';
import { Taken } from './Taken';
import * as zaakTemplate from './templates/zaak.mustache';
import * as zakenTemplate from './templates/zaken.mustache';
import { Zaken } from './Zaken';
import { render } from '../../shared/render';

export async function zakenRequestHandler(
  cookies: string,
  dynamoDBClient: DynamoDBClient,
  config: { zakenClient: OpenZaakClient; zaak?: string; takenSecret: string }) {

  console.time('request');
  console.timeLog('request', 'start request');
  console.timeLog('request', 'finished init');

  let session = new Session(cookies, dynamoDBClient);
  await session.init();

  console.timeLog('request', 'init session');
  console.debug(session, session.isLoggedIn(), cookies);
  if (session.isLoggedIn() == true) {
    try {
      let response;
      if (config.zaak) {
        response = await singleZaakRequest(session, config.zakenClient, config.zaak, config.takenSecret);
      } else {
        response = await listZakenRequest(session, config.zakenClient);
      }
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
  statuses.allowDomains(['APV']);
  const zaken = await statuses.list();
  data.zaken = zaken;
  console.timeLog('request', 'zaken received');

  // render page
  const html = await render(data, zakenTemplate.default);
  return Response.html(html, 200, session.getCookie());
}


async function singleZaakRequest(session: Session, client: OpenZaakClient, zaak: string, takenSecret: string) {

  console.timeLog('request', 'Api Client init');

  let data = {
    volledigenaam: session.getValue('username'),
    title: 'Zaak',
    shownav: true,
    zaak: <any>null,
  };

  const bsn = new Bsn(session.getValue('bsn'));
  const statuses = new Zaken(client, bsn, { taken: taken(takenSecret) });
  statuses.allowDomains(['APV']);
  data.zaak = await statuses.get(zaak);
  console.timeLog('request', 'zaak received');

  // render page
  const html = await render(data, zaakTemplate.default);
  return Response.html(html, 200, session.getCookie());
}


function taken(secret: string): Taken {
  if (!process.env.VIP_TOKEN_BASE_URL) {
    throw Error('No VIP_TOKEN_BASE_URL provided');
  }
  const instance = axios.create(
    {
      headers: {
        Authorization: 'Token ' + secret,
      },
    },
  );
  const openZaakClient = new OpenZaakClient({
    baseUrl: new URL(process.env.VIP_TOKEN_BASE_URL),
    axiosInstance: instance,
  });

  return new Taken(openZaakClient);

}
