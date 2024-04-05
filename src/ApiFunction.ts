import { aws_lambda as Lambda, aws_dynamodb, Duration, Stack } from 'aws-cdk-lib';
import { IRole } from 'aws-cdk-lib/aws-iam';
import { IFilterPattern, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import { LambdaReadOnlyPolicy } from './iam/lambda-readonly-policy';

type T = Lambda.Function;

export interface ApiFunctionProps {
  apiFunction: {new(scope: Construct, id:string, props?: Lambda.FunctionProps): T };
  description: string;
  codePath: string;
  table: aws_dynamodb.ITable;
  tablePermissions: string;
  applicationUrlBase?: string;
  environment?: {[key: string]: string};
  monitorFilterPattern?: IFilterPattern;
  readOnlyRole: IRole;
}

export class ApiFunction extends Construct {
  lambda: Lambda.Function;

  constructor(scope: Construct, id: string, props: ApiFunctionProps) {
    super(scope, id);
    // See https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/Lambda-Insights-extension-versionsx86-64.html
    const insightsArn = `arn:aws:lambda:${Stack.of(this).region}:580247275435:layer:LambdaInsightsExtension:21`;
    this.lambda = new props.apiFunction(this, 'lambda', {
      runtime: Lambda.Runtime.NODEJS_18_X,
      memorySize: 1024,
      timeout: Duration.seconds(10),
      handler: 'index.handler',
      description: props.description,
      code: Lambda.Code.fromInline('empty'), // Overwritten,
      insightsVersion: Lambda.LambdaInsightsVersion.fromInsightVersionArn(insightsArn),
      logRetention: RetentionDays.ONE_MONTH,
      environment: {
        SESSION_TABLE: props.table.tableName,
        ...props.environment,
      },
    });
    props.table.grantReadWriteData(this.lambda.grantPrincipal);

    // this.monitor(props.monitorFilterPattern); Remove monitor, prep for move
    this.allowAccessToReadOnlyRole(props.readOnlyRole);
  }


  private allowAccessToReadOnlyRole(role: IRole) {
    role.addManagedPolicy(
      new LambdaReadOnlyPolicy(this, 'read-policy', {
        functionArn: this.lambda.functionArn,
        logGroupArn: this.lambda.logGroup.logGroupArn,
      }),
    );
  }
}
