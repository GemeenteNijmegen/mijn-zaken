export abstract class Statics {
  static readonly projectName: string = 'mijn-zaken';

  /**
   * Imported arns from Mijn Nijmegen
   */
  static readonly ssmApiGatewayId: string = '/cdk/mijn-nijmegen/apigateway-id';
  static readonly ssmSessionsTableArn: string = '/cdk/mijn-nijmegen/sessionstable-arn';
  static readonly ssmDataKeyArn: string = '/cdk/mijn-nijmegen/kms-datakey-arn';
  static readonly ssmReadOnlyRoleArn: string = '/cdk/mijn-nijmegen/role-readonly-arn';


  static readonly ssmUserId: string = '/cdk/mijn-zaken/vip-jwt-userid';
  static readonly ssmClientId: string = '/cdk/mijn-zaken/vip-jwt-clientid';
  static readonly ssmBaseUrl: string = '/cdk/mijn-zaken/vip-base-url';
  static readonly ssmTokenBaseUrl: string = '/cdk/mijn-zaken/taken-base-url';

  static readonly ssmSubmissionstorageBaseUrl: string = '/cdk/mijn-zaken/submissionstorage-base-url';

  /**
   * Secret for VIP jwt token
   */
  static readonly vipJwtSecret: string = '/cdk/mijn-zaken/vip-jwttoken-new';
  static readonly vipTakenSecret: string = '/cdk/mijn-zaken/vip-takentoken-new';

  static readonly submissionstorageKey: string = '/cdk/mijn-zaken/submissionstorage-key';

  /*
   * Environments (old lz)
   */

  static readonly deploymentEnvironment = {
    account: '836443378780',
    region: 'eu-central-1',
  };

  static readonly acceptanceEnvironment = {
    account: '021929636313',
    region: 'eu-central-1',
  };

  static readonly productionEnvironment = {
    account: '740606269759',
    region: 'eu-central-1',
  };

}
