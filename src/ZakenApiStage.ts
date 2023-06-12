import { Stage, StageProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ZakenApiStack } from './ZakenApiStack';
import { Configurable } from './Configuration';

export interface ZakenApiStageProps extends StageProps, Configurable {}

/**
 * Stage responsible for the API Gateway and lambdas
 */
export class ZakenApiStage extends Stage {
  constructor(scope: Construct, id: string, props: ZakenApiStageProps) {
    super(scope, id, props);

    new ZakenApiStack(this, 'zaken-api');
  }
}