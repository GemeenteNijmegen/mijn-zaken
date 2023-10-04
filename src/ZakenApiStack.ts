import * as apigatewayv2 from '@aws-cdk/aws-apigatewayv2-alpha';
import { HttpRouteKey } from '@aws-cdk/aws-apigatewayv2-alpha';
import { HttpLambdaIntegration } from '@aws-cdk/aws-apigatewayv2-integrations-alpha';
import { Stack, aws_ssm as SSM, aws_kms } from 'aws-cdk-lib';
import { ITable, Table } from 'aws-cdk-lib/aws-dynamodb';
import { Role } from 'aws-cdk-lib/aws-iam';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';
import { ApiFunction } from './ApiFunction';
import { ZakenFunction } from './app/zaken/zaken-function';
import { Statics } from './statics';

export class ZakenApiStack extends Stack {
  private sessionsTable: ITable;
  private api: apigatewayv2.IHttpApi;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    const sessionsTableArn = SSM.StringParameter.fromStringParameterName(this, 'sessions-table-arn', Statics.ssmSessionsTableArn).stringValue;
    const keyArn = SSM.StringParameter.fromStringParameterName(this, 'key-arn', Statics.ssmDataKeyArn).stringValue;

    /**
     * Use fromTableAttributes so we can pass in the encryption key. This
     * way the table.grantReadWriteData() call actually sets the correct
     * KMS policy fields (kms:Encrypt etc.)
     */
    this.sessionsTable = Table.fromTableAttributes(this, 'sessionstable', {
      encryptionKey: aws_kms.Key.fromKeyArn(this, 'data-key', keyArn),
      tableArn: sessionsTableArn,
    });

    const apiGatewayId = SSM.StringParameter.fromStringParameterName(this, 'gatewayid', Statics.ssmApiGatewayId);
    this.api = apigatewayv2.HttpApi.fromHttpApiAttributes(this, 'apigateway', { httpApiId: apiGatewayId.stringValue });
    this.setFunctions();
  }

  /**
   * Create and configure lambda's for all api routes, and
   * add routes to the gateway.
   */
  setFunctions() {

    //const secretMTLSPrivateKey = aws_secretsmanager.Secret.fromSecretNameV2(this, 'tls-key-secret', Statics.secretMTLSPrivateKey);
    //const tlskeyParam = SSM.StringParameter.fromStringParameterName(this, 'tlskey', Statics.ssmMTLSClientCert);
    //const tlsRootCAParam = SSM.StringParameter.fromStringParameterName(this, 'tlsrootca', Statics.ssmMTLSRootCA);

    const readOnlyRole = Role.fromRoleArn(this, 'readonly', SSM.StringParameter.valueForStringParameter(this, Statics.ssmReadOnlyRoleArn));

    const jwtSecret = Secret.fromSecretNameV2(this, 'jwt-token-secret', Statics.vipJwtSecret);
    const tokenSecret = Secret.fromSecretNameV2(this, 'taken-token-secret', Statics.vipTakenSecret);
    const zakenFunction = new ApiFunction(this, 'zaken-function', {
      description: 'Zaken-lambda voor de Mijn Nijmegen-applicatie.',
      codePath: 'app/zaken',
      table: this.sessionsTable,
      tablePermissions: 'ReadWrite',
      environment: {
        VIP_JWT_SECRET_ARN: jwtSecret.secretArn,
        VIP_TAKEN_SECRET_ARN: tokenSecret.secretArn,
        VIP_JWT_USER_ID: SSM.StringParameter.valueForStringParameter(this, Statics.ssmUserId),
        VIP_JWT_CLIENT_ID: SSM.StringParameter.valueForStringParameter(this, Statics.ssmClientId),
        VIP_BASE_URL: SSM.StringParameter.valueForStringParameter(this, Statics.ssmBaseUrl),
        VIP_TOKEN_BASE_URL: SSM.StringParameter.valueForStringParameter(this, Statics.ssmBaseUrl),
      },
      readOnlyRole,
      apiFunction: ZakenFunction,
    });
    jwtSecret.grantRead(zakenFunction.lambda);

    new apigatewayv2.HttpRoute(this, 'zaken-route', {
      httpApi: this.api,
      integration: new HttpLambdaIntegration('zaken', zakenFunction.lambda),
      routeKey: HttpRouteKey.with('/zaken', apigatewayv2.HttpMethod.GET),
    });

    new apigatewayv2.HttpRoute(this, 'zaak-route', {
      httpApi: this.api,
      integration: new HttpLambdaIntegration('zaak', zakenFunction.lambda),
      routeKey: HttpRouteKey.with('/zaken/{zaak}', apigatewayv2.HttpMethod.GET),
    });
  }
}
