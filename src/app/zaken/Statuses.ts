import { OpenZaakClient } from "./OpenZaakClient";

export class Statuses {
  private client: OpenZaakClient;
  private statusTypesPromise: Promise<any>;
  private zaakTypesPromise: Promise<any>;
  private resultaatTypesPromise: Promise<any>;

  private statusTypes?: any;
  private zaakTypes?: any;
  private resultaatTypes?: any;

  constructor(client: OpenZaakClient) {
    this.client = client;
    this.zaakTypesPromise = this.client.request('/catalogi/api/v1/zaaktypen');
    this.statusTypesPromise = this.client.request('/catalogi/api/v1/statustypen');
    this.resultaatTypesPromise = this.client.request('/catalogi/api/v1/resultaattypen');
  }

  async list() {
    await this.metaData();
    const params = new URLSearchParams({
      rol__betrokkeneIdentificatie__natuurlijkPersoon__inpBsn: '900026236',
      page: '1'
    });
    
    // Get all zaken
    const zaken = await this.client.request('https://openzaak.woweb.app/zaken/api/v1/zaken', params);
    console.debug(zaken);
    const [statussen, resultaten] = await this.zaakMetaData(zaken);
    return this.summarizeZaken(zaken, statussen, resultaten);
  }
  /**
   * Gather metadata for zaken
   * 
   * @param zaken all zaken we're interested in
   * @returns `[statussen, resultaten]` An array with two elements, containing the status- and resultaat-objects
   */
  private async zaakMetaData(zaken: any) {
    // Gather status-urls from zaken, so we can get all statusses in parallel
    const status_urls = zaken.results.map((zaak: any) => zaak.status).filter((status: any) => status != null);
    // Gather resultaat-urls from zaken, so we can get all resultaten in parallel
    const resultaat_urls = zaken.results.map((zaak: any) => zaak.resultaat).filter((resultaat: any) => resultaat != null);

    // Get all statuses and resultaten in parallel
    return await Promise.all([
      Promise.all(status_urls.map((status: string) => this.client.request(status))),
      Promise.all(resultaat_urls.map((resultaat: string) => this.client.request(resultaat)))
    ]);
  }

  private summarizeZaken(zaken: any, statussen: any[], resultaten: any[]) {
    const zaak_summaries: any[] = [];
    for (const zaak of zaken.results) {
      const status = statussen.find((status: any) => status.url == zaak.status);
      const resultaat = resultaten.find((resultaat: any) => resultaat.url == zaak.resultaat);
      const zaaktype = this.zaakTypes.results.find((type: any) => type.url == zaak.zaaktype).omschrijving;
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
        resultaat: resultaat_type
      });
    }
    return zaak_summaries;
  }

  /** Guarantee metadata promises are resolved */
  private async metaData() {
    if(!this.zaakTypes || !this.statusTypes || !this.resultaatTypes) {
      [this.zaakTypes, this.statusTypes, this.resultaatTypes] = await Promise.all([this.zaakTypesPromise, this.statusTypesPromise, this.resultaatTypesPromise]);
    }
  }
}
