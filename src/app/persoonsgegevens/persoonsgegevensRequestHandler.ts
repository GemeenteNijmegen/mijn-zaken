import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { ApiClient } from '@gemeentenijmegen/apiclient';

import { Response } from '@gemeentenijmegen/apigateway-http/lib/V2/Response';
import { Session } from '@gemeentenijmegen/session';
import { BrpApi } from './BrpApi';
import * as template from './templates/persoonsgegevens.mustache';
import { render } from '../../shared/render';

export async function persoonsgegevensRequestHandler(cookies: string, apiClient: ApiClient, dynamoDBClient: DynamoDBClient) {
  console.time('request');
  console.timeLog('request', 'start request');
  console.timeLog('request', 'finished init');
  let session = new Session(cookies, dynamoDBClient);
  await session.init();
  console.timeLog('request', 'init session');
  if (session.isLoggedIn() == true) {
    // Get API data
    const response = await handleLoggedinRequest(session, apiClient);
    console.timeEnd('request');
    return response;
  }
  console.timeEnd('request');
  return Response.redirect('/login');
}

async function handleLoggedinRequest(session: Session, apiClient: ApiClient) {
  console.timeLog('request', 'Api Client init');
  const bsn = session.getValue('bsn');
  const brpApi = new BrpApi(apiClient);
  console.timeLog('request', 'Brp Api');

  const brpData = await brpApi.getBrpData(bsn);
  const data = brpData;
  data.volledigenaam = session.getValue('username');

  data.title = 'Persoonsgegevens';
  data.shownav = true;
  // render page
  const html = await render(data, template.default);
  return Response.html(html, 200, session.getCookie());
}

