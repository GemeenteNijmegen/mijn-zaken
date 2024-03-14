import axios, { Axios, AxiosInstance } from 'axios';
import { Inzending, InzendingSchema, InzendingenSchema } from './Inzending';
import { User } from './User';
import { ZaakConnector, ZaakSummary } from './ZaakConnector';

export class Inzendingen implements ZaakConnector {
  private axios: Axios;
  private baseUrl: string;
  constructor(config: {
    baseUrl: URL | string;
    axiosInstance?: AxiosInstance | undefined;
    accessKey?: string | undefined;
  }) {
    this.baseUrl = config.baseUrl.toString();
    this.axios = this.initAxios({ baseUrl: this.baseUrl, accessKey: config.accessKey });
    this.setupDebugInterceptor();
  }

  private setupDebugInterceptor() {
    if (process.env.DEBUG) {
      this.axios.interceptors.request.use(function (configuration) {
        console.log(configuration);
        return configuration;
      }, function (error) {
        return Promise.reject(error);
      });
    }
  }

  private initAxios(config: {
    baseUrl: URL | string;
    axiosInstance?: AxiosInstance | undefined;
    accessKey?: string | undefined;
  }) {
    if (config.axiosInstance) {
      return config.axiosInstance;
    } else {
      if (!config.accessKey) {
        throw Error('access key must be provided for inzendingen.');
      }
      return axios.create(
        {
          baseURL: this.baseUrl,
          headers: {
            'x-api-key': config.accessKey,
          },
        },
      );
    }
  }

  async request(endpoint: string, params?: URLSearchParams): Promise<any> {
    const paramString = params ? `?${params}` : '';
    const url =`${endpoint}${paramString}`;
    try {
      console.debug('getting ', this.axios.getUri({ url }));
      const response = await this.axios.get(url);
      if (response.status != 200) {
        console.debug(response.request.responseURL);
        throw Error('Unexpected response: ' + response.status);
      }
      return response.data;
    } catch (error: any) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.log(error.response.status);
        console.log(error.response.headers);
      } else if (error.request) {
        // The request was made but no response was received
        // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
        // http.ClientRequest in node.js
        console.log(error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.log('Error', error.message);
      }
      console.log(error.config);
      return error;
    }
  }

  async list(user: User): Promise<ZaakSummary[]> {
    const params = new URLSearchParams({
      user_id: user.identifier,
      user_type: user.type,
    });
    const results = await this.request('submissions', params);
    const inzendingen = InzendingenSchema.parse(results);
    return inzendingen.map(inzending => this.summarize(inzending));
  }

  async get(key: string, user: User): Promise<any> {
    const params = new URLSearchParams({
      user_id: user.identifier,
      user_type: user.type,
    });
    const results = await this.request(`submissions/${key}`, params);
    const submission = this.summarizeSingle(InzendingSchema.parse(results));
    console.debug('formatted inzending', submission);
    return submission;
  }


  async download(key: string) {
    const params = new URLSearchParams({
      key: key,
    });
    const results = await this.request('download', params);
    return results;
  }

  summarize(inzending: Inzending): ZaakSummary {
    return {
      identifier: inzending.key,
      internal_id: `inzendingen/${inzending.key}`,
      registratiedatum: inzending?.dateSubmitted,
      zaak_type: inzending.formTitle,
      status: 'ontvangen',
    };
  }

  summarizeSingle(inzending: Inzending) {
    const single = {
      id: inzending.formTitle,
      key: inzending.key,
      registratiedatum: inzending.dateSubmitted,
      status: 'ontvangen',
      documenten: inzending.attachments.map((attachment) => {
        return {
          url: `/download/${inzending.key}/attachments/${attachment}`,
          titel: attachment,
          registratieDatum: inzending.dateSubmitted,
          sort_order: 1,
        };
      }),
    };
    // Add the PDF link to the documenten-list
    single.documenten.push({
      url: `/download/${inzending.key}/${inzending.key}.pdf`,
      titel: 'Formulier (PDF)',
      registratieDatum: inzending.dateSubmitted,
      sort_order: 0,
    });
    return single;
  }
}
