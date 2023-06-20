import axios, { Axios, AxiosInstance } from "axios";
import jwt from "jsonwebtoken";

export class OpenZaakClient {
  private axios: Axios;
  constructor(config: {
    baseUrl: URL,
    axiosInstance?: AxiosInstance
    clientId?: string,
    userId?: string,
    secret?: string
  }) {
    this.axios = this.initAxios(config);
    if(process.env.DEBUG) {
      this.axios.interceptors.request.use(function (config) {
        console.log(config)
        return config;
      }, function (error) {
        return Promise.reject(error);
      });
    }
  }

  private initAxios(config: { axiosInstance?: AxiosInstance | undefined; clientId?: string | undefined; userId?: string | undefined; secret?: string | undefined; baseUrl: URL}) {
    if (config.axiosInstance) {
      return config.axiosInstance;
    } else {
      if (!config.clientId || !config.userId || !config.secret) {
        throw Error('client Id, userId and secret must be provided in config if no axios Instance is provided');
      }
      return axios.create(
        {
          baseURL: config.baseUrl.toString(),
          headers: {
            "Authorization": "Bearer " + this.jwtToken(config.clientId, config.userId, config.secret),
            "Accept-Crs": "EPSG:4326",
            "Content-Crs": "EPSG:4326"
          }
        }
      );
    }
  }

  private jwtToken(clientId: string, userId: string, secret: string) {
    const token = jwt.sign({
      iss: clientId,
      iat: Date.now(),
      client_id: clientId,
      user_id: userId,
      user_representation: userId
    }, secret);
    return token;
  }

  async  request(endpoint: string, params?: URLSearchParams): Promise<any> {
    console.count('aantal requests');
    const paramString = params ? `?${params}` : '';
    const url =`${endpoint}${paramString}`;
    const res = await this.axios.get(url);
    return res.data;
  }
}
