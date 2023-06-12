export abstract class Statics {
  static readonly projectName: string = 'mijn-zaken';

  /**
   * Imported arns from Mijn Nijmegen
   */
  static readonly ssmApiGatewayId: string = '/cdk/mijn-nijmegen/apigateway-id';
  static readonly ssmSessionsTableArn: string = '/cdk/mijn-nijmegen/sessionstable-arn';
  static readonly ssmDataKeyArn: string = '/cdk/mijn-nijmegen/kms-datakey-arn';
  static readonly ssmReadOnlyRoleArn: string = '/cdk/mijn-nijmegen/role-readonly-arn';

  /**
   * Certificate private key for mTLS
   */
  static readonly secretMTLSPrivateKey: string = '/cdk/mijn-zaken/mtls-privatekey';

  /**
   * Certificate for mTLS
   */
  static readonly ssmMTLSClientCert: string = '/cdk/mijn-zaken/mtls-clientcert';

  /**
    * Root CA for mTLS (PKIO root)
    */
  static readonly ssmMTLSRootCA: string = '/cdk/mijn-zaken/mtls-rootca';

  /**
   * BRP API endpoint
   */
  static readonly ssmBrpApiEndpointUrl: string = '/cdk/mijn-zaken/brp-api-url';

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