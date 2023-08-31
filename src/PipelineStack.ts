import { PermissionsBoundaryAspect } from '@gemeentenijmegen/aws-constructs';
import { Aspects, CfnParameter, Stack, StackProps, Tags, pipelines } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Configurable } from './Configuration';
import { ParameterStage } from './ParameterStage';
import { Statics } from './statics';
import { ZakenApiStage } from './ZakenApiStage';

export interface PipelineStackProps extends StackProps, Configurable {}

export class PipelineStack extends Stack {


  constructor(scope: Construct, id: string, props: PipelineStackProps) {
    super(scope, id, props);
    Tags.of(this).add('cdkManaged', 'yes');
    Tags.of(this).add('Project', Statics.projectName);
    Aspects.of(this).add(new PermissionsBoundaryAspect());

    const connectionArn = new CfnParameter(this, 'connectionArn');
    const pipeline = this.pipeline(props, connectionArn.valueAsString);

    pipeline.addStage(new ParameterStage(this, 'mijn-zaken-parameters', {
      env: props.configuration.deployToEnvironment,
    }));

    pipeline.addStage(new ZakenApiStage(this, 'mijn-zaken-api', {
      env: props.configuration.deployToEnvironment,
      configuration: props.configuration,
    }));

  }

  pipeline(props: PipelineStackProps, codeStarConnectionArn: string): pipelines.CodePipeline {
    const branch = props.configuration.branchName;
    const source = pipelines.CodePipelineSource.connection('GemeenteNijmegen/mijn-zaken', branch, {
      connectionArn: codeStarConnectionArn,
    });
    const pipeline = new pipelines.CodePipeline(this, `mijnzaken-${branch}`, {
      pipelineName: `mijnzaken-${branch}`,
      dockerEnabledForSelfMutation: true,
      dockerEnabledForSynth: true,
      crossAccountKeys: true,
      synth: new pipelines.ShellStep('Synth', {
        input: source,
        env: {
          BRANCH_NAME: branch,
        },
        commands: [
          'yarn install --frozen-lockfile',
          'yarn build',
        ],
      }),
    });
    return pipeline;
  }
}
