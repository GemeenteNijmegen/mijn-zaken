import { Bsn } from '@gemeentenijmegen/utils';

/**
 * Several types of user exist:
 * - 'Natuurlijk persoon' (a human), having a BSN and a name (provided by the BRP)
 * - 'Organisation', having a KVK identification number, and a company name (provided by eherkenning)
 */
export interface User {
  identifier: string;
  type: 'person' | 'organisation';
  userName?: string;
}

/**
 * Implementation of a 'natuurlijk persoon', a human, having a BSN.
 */
export class Person implements User {
  bsn: Bsn;
  identifier: string;
  userName?: string;
  type: 'person' | 'organisation' = 'person';
  constructor(bsn: Bsn, userName?: string) {
    this.bsn = bsn;
    this.identifier = bsn.bsn;
    this.userName = userName;
  }
}

/**
 * Implementation of a user of type 'organisation', having a KVK number.
 */
export class Organisation implements User {
  kvk: string;
  identifier: string;
  type: 'person' | 'organisation' = 'organisation';
  userName?: string;

  constructor(kvk: string, userName?: string) {
    this.kvk = kvk;
    this.identifier = kvk;
    this.userName = userName;
  }
}
