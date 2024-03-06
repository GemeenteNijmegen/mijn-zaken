import axios, { Axios, AxiosInstance } from 'axios';
import { Inzending, InzendingSchema, InzendingenSchema } from './Inzending';
import { User } from './User';

export class Inzendingen {
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

  async list(user: User): Promise<Inzending[]> {
    const params = new URLSearchParams({
      user_id: user.identifier,
      user_type: user.type,
    });
    const results = await this.request('submissions', params);
    return InzendingenSchema.parse(results);
  }

  async get(key: string, user: User): Promise<Inzending> {
    const params = new URLSearchParams({
      user_id: user.identifier,
      user_type: user.type,
    });
    const results = await this.request(`submissions/${key}`, params);
    return InzendingSchema.parse(results);
  }


  async download(key: string) {
    const params = new URLSearchParams({
      key: key,
    });
    const results = await this.request('download', params);
    return results;
  }
}