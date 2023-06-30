import { Bsn } from '@gemeentenijmegen/utils';
import { OpenZaakClient } from './OpenZaakClient';

export class Zaken {
  private client: OpenZaakClient;
  private statusTypesPromise: Promise<any>;
  private zaakTypesPromise: Promise<any>;
  private resultaatTypesPromise: Promise<any>;

  private statusTypes?: any;
  private zaakTypes?: any;
  private resultaatTypes?: any;

  private bsn: Bsn;

  constructor(client: OpenZaakClient, bsn: Bsn) {
    this.client = client;
    this.bsn = bsn;
    this.zaakTypesPromise = this.client.request('/catalogi/api/v1/zaaktypen');
    this.statusTypesPromise = this.client.request('/catalogi/api/v1/statustypen');
    this.resultaatTypesPromise = this.client.request('/catalogi/api/v1/resultaattypen');
  }

  async list() {
    console.timeLog('zaken status', 'awaiting metadata');
    await this.metaData();
    const params = new URLSearchParams({
      rol__betrokkeneIdentificatie__natuurlijkPersoon__inpBsn: this.bsn.bsn,
      page: '1',
    });

    // Get all zaken
    const zaken = await this.client.request('/zaken/api/v1/zaken', params);
    console.timeLog('zaken status', 'received zaken');
    if (zaken.results) {
      const [statussen, resultaten] = await this.zaakMetaData(zaken);
      console.timeLog('zaken status', 'received zaakmetadata');
      return this.summarizeZaken(zaken, statussen, resultaten);
    }
    return [];
  }

  async get(zaakId: string) {
    console.timeLog('zaken status', 'awaiting metadata');
    await this.metaData();
    const [zaak, rol] = await Promise.all([
      this.client.request(`/zaken/api/v1/zaken/${zaakId}`),
      this.client.request(`/zaken/api/v1/rollen?betrokkeneIdentificatie__natuurlijkPersoon__inpBsn=${this.bsn.bsn}&zaak=${this.client.baseUrl}/zaken/api/v1/zaken/${zaakId}`),
    ]);

    const statusPromise = zaak.status ? this.client.request(zaak.status) : null;
    const resultaatPromise = zaak.resultaat ? this.client.request(zaak.resultaat) : null;
    const [status, resultaat] = await Promise.all([statusPromise, resultaatPromise]);

    if (Number(rol?.count) >= 1) {
      return {
        id: zaak.identificatie,
        registratiedatum: zaak.registratiedatum,
        zaak_type: this.zaakTypes.results.find((type: any) => type.url == zaak.zaaktype)?.omschrijving,
        status: this.statusTypes.results.find((type: any) => type.url == status.statustype)?.omschrijving,
        resultaat: resultaat?.omschrijving ?? null,
      };
    }
    return false;
  }
  /**
   * Gather metadata for zaken
   *
   * @param zaken all zaken we're interested in
   * @returns `[statussen, resultaten]` An array with two elements, containing the status- and resultaat-objects
   */
  private async zaakMetaData(zaken: any) {
    if (!zaken.results) {
      throw Error('No zaken found');
    };
    // Gather status-urls from zaken, so we can get all statusses in parallel
    const status_urls = zaken.results.map((zaak: any) => zaak.status).filter((status: any) => status != null);
    // Gather resultaat-urls from zaken, so we can get all resultaten in parallel
    const resultaat_urls = zaken.results.map((zaak: any) => zaak.resultaat).filter((resultaat: any) => resultaat != null);

    // Get all statuses and resultaten in parallel
    return Promise.all([
      Promise.all(status_urls.map((status: string) => this.client.request(status))),
      Promise.all(resultaat_urls.map((resultaat: string) => this.client.request(resultaat))),
    ]);
  }

  private summarizeZaken(zaken: any, statussen: any[], resultaten: any[]) {
    const zaak_summaries: any[] = [];
    for (const zaak of zaken.results) {
      const status = statussen.find((aStatus: any) => aStatus.url == zaak.status);
      const resultaat = resultaten.find((aResultaat: any) => aResultaat.url == zaak.resultaat);
      const zaaktype = this.zaakTypes.results.find((type: any) => type.url == zaak.zaaktype)?.omschrijving;
      let status_type = null;
      if (status) {
        status_type = this.statusTypes.results.find((type: any) => type.url == status.statustype).omschrijving;
      }
      let resultaat_type = null;
      if (resultaat) {
        resultaat_type = this.resultaatTypes.results.find((type: any) => type.url == resultaat.resultaattype).omschrijving;
      }
      zaak_summaries.push({
        id: zaak.identificatie,
        registratiedatum: zaak.registratiedatum,
        zaak_type: zaaktype,
        status: status_type,
        resultaat: resultaat_type,
      });
    }
    // Registratiedatum is formatted YYYY-MM-DD. Sort reverse-chronological
    return zaak_summaries.sort((a: any, b: any) => { return a.registratiedatum < b.registratiedatum ? 1 : -1; });
  }

  /** Guarantee metadata promises are resolved */
  private async metaData() {
    if (!this.zaakTypes || !this.statusTypes || !this.resultaatTypes) {
      [
        this.zaakTypes,
        this.statusTypes,
        this.resultaatTypes,
      ] = await Promise.all([
        this.zaakTypesPromise,
        this.statusTypesPromise,
        this.resultaatTypesPromise,
      ]);
    }
  }
}
