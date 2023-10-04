import { PermissionsBoundaryAspect } from '@gemeentenijmegen/aws-constructs';
import { Stack, Tags, Stage, StageProps, Aspects } from 'aws-cdk-lib';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';
import { Statics } from './statics';

/**
 * Stage for creating SSM parameters. This needs to run
 * before stages that use them.
 */

export class ParameterStage extends Stage {
  constructor(scope: Construct, id: string, props: StageProps) {
    super(scope, id, props);
    Tags.of(this).add('cdkManaged', 'yes');
    Tags.of(this).add('Project', Statics.projectName);
    Aspects.of(this).add(new PermissionsBoundaryAspect());

    new ParameterStack(this, 'params');
  }
}
/**
 * Stack that creates ssm parameters for the application.
 * These need to be present before stack that use them.
 */

export class ParameterStack extends Stack {
  constructor(scope: Construct, id: string) {
    super(scope, id);
    Tags.of(this).add('cdkManaged', 'yes');
    Tags.of(this).add('Project', Statics.projectName);

    new ssmParamsConstruct(this, 'plain');
  }
}
/**
 * All SSM parameters needed for the application.
 * Some are created with a sensible default, others are
 * empty and need to be filled or changed via the console.
 */

export class ssmParamsConstruct extends Construct {

  constructor(scope: Construct, id: string) {
    super(scope, id);
    Tags.of(this).add('cdkManaged', 'yes');
    Tags.of(this).add('Project', Statics.projectName);

    new StringParameter(this, 'ssm_zaken_1', {
      stringValue: '-',
      parameterName: Statics.ssmUserId,
    });

    new StringParameter(this, 'ssm_zaken_2', {
      stringValue: '-',
      parameterName: Statics.ssmBaseUrl,
    });

    new StringParameter(this, 'ssm_zaken_3', {
      stringValue: '-',
      parameterName: Statics.ssmClientId,
    });

    new StringParameter(this, 'ssm_zaken_4', {
      stringValue: '-',
      parameterName: Statics.ssmTokenBaseUrl,
    });

    new Secret(this, 'secret_1', {
      secretName: Statics.vipTakenSecret,
      description: 'VIP Taken token secret',
    });
  }
}
