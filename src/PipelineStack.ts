import { Stack, StackProps, Tags, pipelines } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ParameterStage } from './ParameterStage';
import { ZakenApiStage } from './ZakenApiStage';
import { Statics } from './statics';
import { Configurable } from './Configuration';

export interface PipelineStackProps extends StackProps, Configurable {}

export class PipelineStack extends Stack {

  
  constructor(scope: Construct, id: string, props: PipelineStackProps) {
    super(scope, id, props);
    Tags.of(this).add('cdkManaged', 'yes');
    Tags.of(this).add('Project', Statics.projectName);
    const pipeline = this.pipeline(props);

    pipeline.addStage(new ParameterStage(this, 'mijn-zaken-parameters', { 
      env: props.configuration.deployToEnvironment 
    }));
      
    pipeline.addStage(new ZakenApiStage(this, 'mijn-zaken-api', { 
      env: props.configuration.deployToEnvironment, 
      configuration: props.configuration,
    }));
  
  }

  pipeline(props: PipelineStackProps): pipelines.CodePipeline {
    const branch = props.configuration.branchName;
    const source = pipelines.CodePipelineSource.connection('GemeenteNijmegen/mijn-zaken', branch, {
      connectionArn: props.configuration.codeStarConnectionArn,
    });
    const pipeline = new pipelines.CodePipeline(this, `mijngegevens-${branch}`, {
      pipelineName: `mijngegevens-${branch}`,
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