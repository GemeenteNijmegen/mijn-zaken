import { App } from 'aws-cdk-lib';
import * as Dotenv from 'dotenv';
import { getConfiguration } from './Configuration';
import { PipelineStack } from './PipelineStack';

Dotenv.config();
const app = new App();

const deployBranch = process.env.BRANCH_NAME ?? 'acceptance';
const configuration = getConfiguration(deployBranch);

new PipelineStack(app, `mijn-zaken-pipeline-${configuration.name}`,
  {
    env: configuration.deployFromEnvironment,
    configuration,
  },
);

app.synth();
