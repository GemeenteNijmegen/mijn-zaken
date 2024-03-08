import { ZaakSummary } from './ZaakConnector';

export class ZaakFormatter {
  static formatList(zaken: ZaakSummary[]) {
    const sorted = zaken
      .sort((a, b) => a.registratiedatum < b.registratiedatum ? 1 : -1)
      .map(zaak => this.formatZaak(zaak));
    return {
      open: sorted.filter(zaak => zaak.resultaat),
      gesloten: sorted.filter(zaak => !zaak.resultaat),
    };
  }

  static formatZaak(zaak: ZaakSummary) {
    return {
      ...zaak,
      registratiedatum: this.humanDate(zaak.registratiedatum),
      verwachtte_einddatum: this.humanDate(zaak.verwachtte_einddatum),
      uiterlijke_einddatum: this.humanDate(zaak.uiterlijke_einddatum),
      einddatum: this.humanDate(zaak.einddatum),
    };
  }

  /**
   * Convert ISO 8601 datestring to something formatted like '12 september 2023'
   */
  private static humanDate(date: Date | undefined) {
    if (!date) { return; }
    return date.toLocaleDateString('nl-NL', { year: 'numeric', month: 'long', day: 'numeric' });
  }
}
