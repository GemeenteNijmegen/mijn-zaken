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
  
  /**
   * Secret for VIP jwt token
   */
  static readonly secret: string = '/cdk/mijn-zaken/vip-jwt-secret';

  /**
   * Codestar connection (old lz)
   */
  static readonly codeStarConnectionArn: string = 'arn:aws:codestar-connections:eu-west-1:418648875085:connection/4f647929-c982-4f30-94f4-24ff7dbf9766';


  /*
   * Environments (old lz)
   */

  static readonly deploymentEnvironment = {
    account: '418648875085',
    region: 'eu-west-1',
  };

  static readonly sandboxEnvironment = {
    account: '122467643252',
    region: 'eu-west-1',
  };

  static readonly acceptanceEnvironment = {
    account: '315037222840',
    region: 'eu-west-1',
  };

  static readonly productionEnvironment = {
    account: '196212984627',
    region: 'eu-west-1',
  };


}
