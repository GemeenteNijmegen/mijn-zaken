import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { Configuration } from '../src/Configuration';
import { PipelineStack } from '../src/PipelineStack';
import { ZakenApiStack } from '../src/ZakenApiStack';

const dummyEnv = {
  account: '123456789012',
  region: 'eu-west-1',
};

const config: Configuration = {
  branchName: 'test',
  name: 'test',
  deployFromEnvironment: dummyEnv,
  deployToEnvironment: dummyEnv,
  allowZakenDomains: ['APV', 'JZ'],
};

test('Snapshot', () => {
  const app = new App();
  const stack = new PipelineStack(app, 'test', {
    env: dummyEnv,
    configuration: config,
  });
  const template = Template.fromStack(stack);
  expect(template.toJSON()).toMatchSnapshot();
});

test('StackHasLambdas', () => {
  const app = new App();

  const stack = new ZakenApiStack(app, 'api', { configuration: config });
  const template = Template.fromStack(stack);
  template.resourceCountIs('AWS::Lambda::Function', 2); //Setting log retention creates a lambda
});
