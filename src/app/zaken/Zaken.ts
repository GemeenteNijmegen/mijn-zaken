import { OpenZaakClient } from './OpenZaakClient';
import { Taken } from './Taken';
import { User } from './User';

interface Config {
  taken?: Taken;

  /**
   * Feature flag: Unless this is true, we will not
   * call the documents endpoint (and thus won't show documents).
   */
  show_documents?: boolean;
}

export class Zaken {
  private client: OpenZaakClient;
  private statusTypesPromise: Promise<any>;
  private zaakTypesPromise: Promise<any>;
  private resultaatTypesPromise: Promise<any>;
  private catalogiPromise: Promise<any>;

  private statusTypes?: any;
  private zaakTypes?: any;
  private resultaatTypes?: any;
  private catalogi?: any;

  private user: User;

  private allowedDomains?: string[];

  private taken?: Taken;

  private show_documents?: boolean;

  constructor(client: OpenZaakClient, user: User, config?: Config) {
    this.client = client;
    this.user = user;
    this.catalogiPromise = this.client.request('/catalogi/api/v1/catalogussen');
    this.zaakTypesPromise = this.client.request('/catalogi/api/v1/zaaktypen');
    this.statusTypesPromise = this.client.requestPaginated('/catalogi/api/v1/statustypen');
    this.resultaatTypesPromise = this.client.request('/catalogi/api/v1/resultaattypen');
    console.time('zaken status');
    this.taken = config?.taken;
    this.show_documents = config?.show_documents;
  }

  /**
   * If this method is called, all further requests are matched
   * for this list of domains. The domains can be found in the zaaktypecatalogus
   * object, and will be matched via zaak.zaaktype => zaaktype.catalogus, => catalogus.domein
   *
   * @param domains a list of domain strings to allow
   */
  public allowDomains(domains: string[]) {
    this.allowedDomains = domains;
  }

  /**
   * List all zaken for a person
   *
   * @returns
   */
  async list() {
    console.timeLog('zaken status', 'awaiting metadata');
    await this.metaData();
    const params = new URLSearchParams({
      rol__betrokkeneIdentificatie__natuurlijkPersoon__inpBsn: this.user.identifier,
      ordering: '-startdatum',
      page: '1',
    });

    // Get all zaken
    const zaken = await this.client.request('/zaken/api/v1/zaken', params);
    //TODO: For companies, we need to use the 'rol' endpoint for now ({{baseUrl}}/zaken/api/v1/rollen?betrokkeneIdentificatie__nietNatuurlijkPersoon__annIdentificatie=<kvknummer>) to get zaken urls, then create a list of zaken
    // {
    //   "results": [
    //       {
    //           "url": "https://openzaak.woweb.app/zaken/api/v1/rollen/703fb21a-88b3-45c5-b9e0-81a3909a0ce0",
    //           "uuid": "703fb21a-88b3-45c5-b9e0-81a3909a0ce0",
    //           "zaak": "https://openzaak.woweb.app/zaken/api/v1/zaken/58d86807-f8e7-42de-9db0-869ea44b8bd5",
    //           "betrokkene": "",
    //           "betrokkeneType": "niet_natuurlijk_persoon",
    //           "roltype": "https://openzaak.woweb.app/catalogi/api/v1/roltypen/b9d8dd80-e163-4df7-9d91-83c76ff93f96",
    //           "omschrijving": "Bezwaarmaker",
    //           "omschrijvingGeneriek": "initiator",
    //           "roltoelichting": "Bezwaarmaker",
    //           "registratiedatum": "2023-06-13T07:45:25.012348Z",
    //           "indicatieMachtiging": "",
    //           "betrokkeneIdentificatie": {
    //               "innNnpId": "",
    //               "annIdentificatie": "<kvk>",
    //               "statutaireNaam": "<name>",
    //               "innRechtsvorm": "",
    //               "bezoekadres": "",
    //               "subVerblijfBuitenland": null
    //           }
    //       },

    // Get all rollen from endpoint rollen
    // Gather all zaken-information (per zaak?)


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
      this.client.request(`/zaken/api/v1/rollen?betrokkeneIdentificatie__natuurlijkPersoon__inpBsn=${this.user.identifier}&zaak=${this.client.baseUrl}zaken/api/v1/zaken/${zaakId}`),
    ]);
    // Only process zaken in allowed catalogi
    if (!this.zaakTypeInAllowedCatalogus(zaak.zaaktype)) { return false; }

    const statusPromise = zaak.status ? this.client.request(zaak.status) : null;
    const resultaatPromise = zaak.resultaat ? this.client.request(zaak.resultaat) : null;
    const documentPromise = this.documents(zaakId);
    const taken = await this.getTaken(zaakId);
    const [status, resultaat, documents] = await Promise.all([statusPromise, resultaatPromise, documentPromise]);
    const zaakType = this.zaakTypes?.results?.find((type: any) => type.url == zaak.zaaktype);

    if (Number(rol?.count) >= 1) { //TODO: Omschrijven (ik gok check of persoon met bsn wel rol heeft in de zaak)
      return {
        uuid: zaak.uuid,
        id: zaak.identificatie,
        registratiedatum: this.humanDate(zaak.registratiedatum),
        verwachtte_einddatum: this.humanDate(zaak.einddatumGepland),
        uiterlijke_einddatum: this.humanDate(zaak.uiterlijkeEinddatumAfdoening),
        einddatum: zaak.einddatum ? this.humanDate(zaak.einddatum) : null,
        zaak_type: zaakType?.omschrijving,
        status_list: this.statusTypesForZaakType(zaakType, status),
        status: this.statusTypes.results.find((type: any) => type.url == status?.statustype)?.omschrijving || null,
        resultaat: resultaat?.omschrijving ?? null,
        documenten: documents,
        has_documenten: documents && documents.length > 0 ? true : false,
        taken: taken,
        has_taken: taken?.count > 0 ? true : false,
      };
    }
    return false;
  }
  private statusTypesForZaakType(zaakType: any, status: any) {
    if (!status) {
      return null;
    }
    const statusTypenUrls = zaakType.statustypen;
    const statusTypen = this.statusTypes?.results.filter((statusType: any) => statusTypenUrls.indexOf(statusType.url) > -1);
    statusTypen.sort((a: any, b: any) => { return a.volgnummer > b.volgnummer ? 1 : -1; });
    let before_current = true;
    const status_list = statusTypen.map((statusType: any) => {
      const current = status.statustype == statusType.url;
      if (current) { before_current = false; }
      return {
        name: statusType.omschrijving,
        is_eind: statusType.isEindstatus,
        completed: before_current,
        volgnummer: statusType.volgnummer,
        current,
      };
    });
    return status_list;
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
    const zaak_summaries: { open: any[]; gesloten: any[] } = { open: [], gesloten: [] };
    for (const zaak of zaken.results) {
      // Only process zaken in allowed catalogi
      if (!this.zaakTypeInAllowedCatalogus(zaak.zaaktype)) { continue; }
      const status = statussen.find((aStatus: any) => aStatus.url == zaak.status);
      const resultaat = resultaten.find((aResultaat: any) => aResultaat.url == zaak.resultaat);
      console.debug(this.zaakTypes);
      const zaaktype = this.zaakTypes.results.find((type: any) => type.url == zaak.zaaktype)?.omschrijving;
      let status_type = null;
      if (status) {
        status_type = this.statusTypes.results.find((type: any) => type.url == status.statustype)?.omschrijving;
      }
      let resultaat_type = null;
      if (resultaat) {
        resultaat_type = this.resultaatTypes.results.find((type: any) => type.url == resultaat.resultaattype)?.omschrijving;
      }
      const summary = {
        id: zaak.identificatie,
        uuid: zaak.uuid,
        registratiedatum: this.humanDate(zaak.registratiedatum),
        verwachtte_einddatum: this.humanDate(zaak.einddatumGepland),
        uiterlijke_einddatum: this.humanDate(zaak.uiterlijkeEinddatumAfdoening),
        einddatum: zaak.einddatum ? this.humanDate(zaak.einddatum) : null,
        zaak_type: zaaktype,
        status: status_type,
        resultaat: resultaat_type,
      };

      if (resultaat) {
        zaak_summaries.gesloten.push(summary);
      } else {
        zaak_summaries.open.push(summary);
      }
    }
    return zaak_summaries;
  }

  /**
   * Convert ISO 8601 datestring to something formatted like '12 september 2023'
   */
  private humanDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString('nl-NL', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  /** Guarantee metadata promises are resolved */
  private async metaData() {
    if (!this.zaakTypes || !this.statusTypes || !this.resultaatTypes || !this.catalogi) {
      [
        this.zaakTypes,
        this.statusTypes,
        this.resultaatTypes,
        this.catalogi,
      ] = await Promise.all([
        this.zaakTypesPromise,
        this.statusTypesPromise,
        this.resultaatTypesPromise,
        this.catalogiPromise,
      ]);
    }
    console.debug('zaaktypes 123', this.zaakTypes);
  }

  /**
   * We need to filter for zaken from specific systems. The catalogi hold
   * the domains (APV & JZ), this filters the catalogi based on the allowed
   * domains (`this.allowedDomains`)
   */
  private allowedCatalogi() {
    if (this.allowedDomains && this.catalogi?.results) {
      return this.catalogi?.results?.filter((catalogus: any) => this.allowedDomains!.includes(catalogus.domein));
    }
    return this.catalogi.results;
  }

  private zaakTypeInAllowedCatalogus(zaakType: any) {
    const catalogi = this.allowedCatalogi();
    if (catalogi) {
      for (let catalogus of this.allowedCatalogi()) {
        if (catalogus?.zaaktypen.includes(zaakType)) { return true; }
      }
      return false;
    }
    return true;
  }

  private async documents(zaakId: string) {
    if (!this.show_documents) { return null; }
    try {
      const zaakinformatieobjecten = await this.client.request(`/zaken/api/v1/zaakinformatieobjecten?zaak=${this.client.baseUrl}zaken/api/v1/zaken/${zaakId}`);

      if (!zaakinformatieobjecten || zaakinformatieobjecten.length <= 0) { return false; }
      const documentUrls = zaakinformatieobjecten
        .map((zaakinformatieobject: any) => zaakinformatieobject.informatieobject).filter((informatieobject: any) => informatieobject != null,
        );
      const enkelvoudiginformatieobjecten = await Promise.all(documentUrls.map((url: string) => this.client.request(url)));
      return enkelvoudiginformatieobjecten.map((object) => {
        return {
          url: object.url,
          titel: object.titel,
          beschrijving: object.beschrijving,
          registratieDatum: object.beginRegistratie,
        };
      });
    } catch (error: any) {
      console.error(error);
      return [];
    }
  }

  async getTaken(zaakId: string) {
    if (!this.taken) { return null; }
    return this.taken.get(zaakId);
  }
}
