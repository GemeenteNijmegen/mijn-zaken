import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { Response } from '@gemeentenijmegen/apigateway-http/lib/V2/Response';
import { Session } from '@gemeentenijmegen/session';
import { Bsn } from '@gemeentenijmegen/utils';
import { Inzendingen } from './Inzendingen';
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
    file?: string;
    takenSecret?: string;
    zaakConnectorId?: string;
  }) {
  console.debug('config, ', config);
  console.time('request');
  console.timeLog('request', 'start request');
  console.timeLog('request', 'finished init');

  let session = new Session(cookies, dynamoDBClient);
  await session.init();

  if (config.takenSecret) {
    config.zaken.setTaken(Taken.takenFromSecret(config.takenSecret));
  }

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
          if (config.file) {
            response = await downloadRequest(session, zaakConnector, config.zaak, config.file);
          } else {
            response = await singleZaakRequest(session, zaakConnector, config.zaak);
          }
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

async function singleZaakRequest(session: Session, zaakConnector: ZaakConnector, zaakId: string) {

  console.timeLog('request', 'Api Client init');

  const user = getUser(session);
  const zaak = await zaakConnector.get(zaakId, user);
  console.timeLog('request', 'zaak received');
  if (zaak) {
    const formattedZaak = ZaakFormatter.formatZaak(zaak);

    const navigation = new Navigation(user.type, { showZaken: true, currentPath: '/zaken' });
    let data = {
      volledigenaam: session.getValue('username'),
      title: 'Zaak',
      shownav: true,
      nav: navigation.items,
      zaak: formattedZaak,
    };
    // render page
    const html = await render(data, zaakTemplate.default);
    return Response.html(html, 200, session.getCookie());
  } else {
    return Response.error(404);
  }
}

async function downloadRequest(session: Session, zaakConnector: ZaakConnector, zaakId: string, file: string) {
  const user = getUser(session);
  const response = await zaakConnector.download(zaakId, file, user);
  if (response) {
    return Response.redirect(response.downloadUrl);
  } else {
    return Response.error(404);
  }
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
