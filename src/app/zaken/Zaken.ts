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

  private allowedDomains?: string[];

  private taken?: Taken;

  private show_documents?: boolean;

  constructor(client: OpenZaakClient, config?: Config) {
    this.client = client;
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
  async list(user: User) {
    console.timeLog('zaken status', 'awaiting metadata');
    await this.metaData();

    let zaken;
    if (user.type == 'person') {
      const params = new URLSearchParams({
        rol__betrokkeneIdentificatie__natuurlijkPersoon__inpBsn: user.identifier,
        ordering: '-startdatum',
        page: '1',
      });

      // Get all zaken
      zaken = await this.client.request('/zaken/api/v1/zaken', params);

    } else if (user.type == 'organisation') {
      const params = new URLSearchParams({
        betrokkeneIdentificatie__nietNatuurlijkPersoon__annIdentificatie: user.identifier,
      });
      const roles = await this.client.request('/zaken/api/v1/rollen', params);
      const zaakUrls = roles?.results?.map((role: any) => role.zaak);
      if (zaakUrls) {
        const zakenResults = await Promise.all(zaakUrls.map((zaakUrl: string) => this.client.request(zaakUrl)));
        zaken = { results: zakenResults };
      }
    }

    console.timeLog('zaken status', 'received zaken');
    if (zaken?.results) {
      console.debug('zaken results,', zaken.results);
      const [statussen, resultaten] = await this.zaakMetaData(zaken);
      console.timeLog('zaken status', 'received zaakmetadata');
      console.timeEnd('zaken status');
      return this.summarizeZaken(zaken, statussen, resultaten);
    }
    console.timeEnd('zaken status');
    return [];
  }

  async get(zaakId: string, user: User) {
    console.timeLog('zaken status', 'awaiting metadata');
    await this.metaData();
    console.timeLog('zaken status', 'retrieved metadata');
    let roleUrl;
    if (user.type == 'person') {
      roleUrl = `/zaken/api/v1/rollen?betrokkeneIdentificatie__natuurlijkPersoon__inpBsn=${user.identifier}&zaak=${this.client.baseUrl}zaken/api/v1/zaken/${zaakId}`;
    } else {
      roleUrl = `/zaken/api/v1/rollen?betrokkeneIdentificatie__nietNatuurlijkPersoon__annIdentificatie=${user.identifier}&zaak=${this.client.baseUrl}zaken/api/v1/zaken/${zaakId}`;
    }
    const [zaak, rol] = await Promise.all([
      this.client.request(`/zaken/api/v1/zaken/${zaakId}`),
      this.client.request(roleUrl),
    ]);
    // Only process zaken in allowed catalogi
    if (!this.zaakTypeInAllowedCatalogus(zaak.zaaktype)) { return false; }

    const statusPromise = zaak.status ? this.client.request(zaak.status) : null;
    const resultaatPromise = zaak.resultaat ? this.client.request(zaak.resultaat) : null;
    const documentPromise = this.documents(zaakId);
    const taken = await this.getTaken(zaakId);
    const [status, resultaat, documents] = await Promise.all([statusPromise, resultaatPromise, documentPromise]);
    const zaakType = this.zaakTypes?.results?.find((type: any) => type.url == zaak.zaaktype);
    console.debug('check role', rol);
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
    console.timeEnd('zaken status');
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
    console.timeEnd('zaken status');
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
      console.debug('summary', summary);
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
  async metaData() {
    console.debug('getting metadata');
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
    console.debug('has metadata');
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
