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
    zaken: [
      {
        id: 'Z23.001592',
        registratiedatum: '2023-06-09',
        zaak_type: 'Bezwaar',
        status: 'Ontvangen',
        resultaat: null,
      },
      {
        id: 'Z23.001438',
        registratiedatum: '2023-03-30',
        zaak_type: 'Klacht',
        status: 'Ontvangen',
        resultaat: null,
      },
      {
        id: 'Z23.001437',
        registratiedatum: '2023-03-28',
        zaak_type: 'Klacht',
        status: 'Ontvangen',
        resultaat: null,
      },
      {
        id: 'Z23.001434',
        registratiedatum: '2023-03-28',
        zaak_type: 'Klacht',
        status: 'Ontvangen',
        resultaat: null,
      },
      {
        id: 'Z23.001432',
        registratiedatum: '2023-03-28',
        zaak_type: 'Klacht',
        status: 'Ontvangen',
        resultaat: null,
      },
      {
        id: 'Z23.001431',
        registratiedatum: '2023-03-28',
        zaak_type: 'Klacht',
        status: 'Ontvangen',
        resultaat: null,
      },
      {
        id: 'Z23.001430',
        registratiedatum: '2023-03-27',
        zaak_type: 'Bezwaar',
        status: 'Ontvangen',
        resultaat: null,
      },
      {
        id: 'Z23.001424',
        registratiedatum: '2023-03-24',
        zaak_type: 'Bezwaar',
        status: 'Ontvangen',
        resultaat: null,
      },
      {
        id: 'Z23.000186',
        registratiedatum: '2023-03-08',
        zaak_type: 'Bezwaar',
        status: 'Afgerond',
        resultaat: 'Gegrond'
      },
      {
        id: 'Z23.000175',
        registratiedatum: '2023-03-08',
        zaak_type: 'Klacht',
        status: 'Afgerond',
        resultaat: 'Formeel - Ongegrond'
      },
      {
        id: 'Z23.000005',
        registratiedatum: '2023-01-04',
        zaak_type: 'Bezwaar',
        status: 'Afgerond',
        resultaat: 'Gegrond'
      },
      {
        id: 'Z22.001801',
        registratiedatum: '2022-11-17',
        zaak_type: 'Bezwaar',
        status: 'Afgerond',
        resultaat: 'Ingetrokken na BIA'
      }
    ]
    
  };

  // render page
  const html = await render(data, template.default);
  return Response.html(html, 200, session.getCookie());
}

