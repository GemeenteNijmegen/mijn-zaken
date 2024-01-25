import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { Response } from '@gemeentenijmegen/apigateway-http/lib/V2/Response';
import { Session } from '@gemeentenijmegen/session';
import { Bsn } from '@gemeentenijmegen/utils';
import axios from 'axios';
import { OpenZaakClient } from './OpenZaakClient';
import { Taken } from './Taken';
import * as zaakTemplate from './templates/zaak.mustache';
import * as zakenTemplate from './templates/zaken.mustache';
import { Organisation, Person, User } from './User';
import { Zaken } from './Zaken';
import { Navigation } from '../../shared/Navigation';
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

  const user = getUser(session);

  const statuses = new Zaken(client, user);
  statuses.allowDomains(['APV']);
  const zaken = await statuses.list();
  console.timeLog('request', 'zaken received');

  const navigation = new Navigation(user.type, { showZaken: true, currentPath: '/' });
  let data = {
    volledigenaam: session.getValue('username'),
    title: 'Lopende zaken',
    shownav: true,
    nav: navigation.items,
    zaken: zaken,
  };

  // render page
  const html = await render(data, zakenTemplate.default);
  return Response.html(html, 200, session.getCookie());
}


function getUser(session: Session) {
  const userType = session.getValue('user_type');
  let user: User;
  if (userType == 'organisation') {
    user = new Organisation(session.getValue('identifier'));
  } else {
    user = new Person(new Bsn(session.getValue('identifier')));
  }
  return user;
}

async function singleZaakRequest(session: Session, client: OpenZaakClient, zaak: string, takenSecret: string) {

  console.timeLog('request', 'Api Client init');

  const user = getUser(session);
  const statuses = new Zaken(client, user, { taken: taken(takenSecret) });
  statuses.allowDomains(['APV']);

  const navigation = new Navigation(user.type, { showZaken: true, currentPath: '/' });

  let data = {
    volledigenaam: session.getValue('username'),
    title: 'Zaak',
    shownav: true,
    nav: navigation.items,
    zaak: await statuses.get(zaak),
  };
  console.debug('zaak', JSON.stringify(data.zaak));
  console.timeLog('request', 'zaak received');

  // render page
  const html = await render(data, zaakTemplate.default);
  return Response.html(html, 200, session.getCookie());
}

/**
 * Return taken object, or undefined if the taken functionality
 * is not yet live. (controlled by the USE_TAKEN env. param).
 *
 * @param secret secret for the taken endpoint
 */
function taken(secret: string): Taken|undefined {
  if (!TakenIsAllowed()) {
    return;
  }
  if (!process.env.VIP_TOKEN_BASE_URL) {
    throw Error('No VIP_TOKEN_BASE_URL provided');
  }
  const instance = axios.create(
    {
      baseURL: process.env.VIP_TOKEN_BASE_URL,
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

/**
 * Check if the taken functionality should be live
 */
function TakenIsAllowed() {
  if (process.env.USE_TAKEN === 'true') {
    return true;
  }
  return false;
}
