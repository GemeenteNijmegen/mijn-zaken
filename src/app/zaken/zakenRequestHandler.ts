import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { Response } from '@gemeentenijmegen/apigateway-http/lib/V2/Response';
import { Session } from '@gemeentenijmegen/session';
import { Bsn } from '@gemeentenijmegen/utils';
import axios from 'axios';
import { Inzendingen } from './Inzendingen';
import { OpenZaakClient } from './OpenZaakClient';
import { Taken } from './Taken';
import * as zaakTemplate from './templates/zaak.mustache';
import * as zakenTemplate from './templates/zaken.mustache';
import { Organisation, Person, User } from './User';
import { ZaakAggregator } from './ZaakAggregator';
import { ZaakConnector } from './ZaakConnector';
import { ZaakFormatter } from './ZaakFormatter';
import { Zaken } from './Zaken';
import { Navigation } from '../../shared/Navigation';
import { render } from '../../shared/render';

export async function zakenRequestHandler(
  cookies: string,
  dynamoDBClient: DynamoDBClient,
  config: {
    zaken: Zaken;
    inzendingen?: Inzendingen;
    zaak?: string;
    zaakConnectorId?: string;
    takenSecret: string;
  }) {
  console.debug('config, ', config);
  let takenObj = undefined;
  if (config.takenSecret) {
    takenObj = taken(config.takenSecret);
    if (takenObj) {
      config.zaken.setTaken(takenObj);
    }
  }
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
        let zaakConnector;
        if (config.zaakConnectorId == 'inzendingen') {
          zaakConnector = config.inzendingen;
        } else if (config.zaakConnectorId == 'zaak') {
          zaakConnector = config.zaken;
        }
        if (zaakConnector) {
          response = await singleZaakRequest(session, zaakConnector, config.zaak);
        } else {
          throw Error('No suitable zaakconnector found');
        }
      } else {
        response = await listZakenRequest(session, config.zaken, config.inzendingen);
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

async function listZakenRequest(session: Session, statuses: Zaken, inzendingen?: Inzendingen) {
  console.timeLog('request', 'Api Client init');

  const user = getUser(session);

  statuses.allowDomains(['APV']);
  let aggregator = zakenAggregator(inzendingen, statuses);
  const zaken = await aggregator.list(user);
  const zaakSummaries = ZaakFormatter.formatList(zaken);

  const navigation = new Navigation(user.type, { showZaken: true, currentPath: '/zaken' });
  let data = {
    volledigenaam: session.getValue('username'),
    title: 'Lopende zaken',
    shownav: true,
    nav: navigation.items,
    zaken: zaakSummaries,
  };
  console.debug('data', JSON.stringify(data.zaken));
  // render page
  const html = await render(data, zakenTemplate.default);
  return Response.html(html, 200, session.getCookie());
}

function zakenAggregator(inzendingen: Inzendingen | undefined, statuses: Zaken) {
  let aggregator;
  if (inzendingen) {
    aggregator = new ZaakAggregator({
      zaakConnectors: {
        zaken: statuses,
        inzendingen: inzendingen,
      },
    });
  } else {
    aggregator = new ZaakAggregator({
      zaakConnectors: {
        zaken: statuses,
      },
    });
  };
  return aggregator;
}

async function singleZaakRequest(session: Session, statuses: ZaakConnector, zaakId: string) {

  console.timeLog('request', 'Api Client init');

  const user = getUser(session);
  const navigation = new Navigation(user.type, { showZaken: true, currentPath: '/zaken' });

  let data = {
    volledigenaam: session.getValue('username'),
    title: 'Zaak',
    shownav: true,
    nav: navigation.items,
    zaak: await statuses.get(zaakId, user),
  };
  console.debug('zaak', JSON.stringify(data.zaak));
  console.timeLog('request', 'zaak received');

  // render page
  const html = await render(data, zaakTemplate.default);
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

/**
 * Return taken object, or undefined if the taken functionality
 * is not yet live. (controlled by the USE_TAKEN env. param).
 *
 * @param secret secret for the taken endpoint
 */
//@ts-ignore Unused for now, may be required later. Should be moved to handler?
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
