import { PermissionsBoundaryAspect } from '@gemeentenijmegen/aws-constructs';
import { Aspects, Stage, StageProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Configurable } from './Configuration';
import { ZakenApiStack } from './ZakenApiStack';

export interface ZakenApiStageProps extends StageProps, Configurable {}

/**
 * Stage responsible for the API Gateway and lambdas
 */
export class ZakenApiStage extends Stage {
  constructor(scope: Construct, id: string, props: ZakenApiStageProps) {
    super(scope, id, props);
    Aspects.of(this).add(new PermissionsBoundaryAspect());

    new ZakenApiStack(this, 'zaken-api', { configuration: props.configuration });
  }
}
