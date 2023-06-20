const { GemeenteNijmegenCdkApp } = require('@gemeentenijmegen/projen-project-type');
const project = new GemeenteNijmegenCdkApp({
  cdkVersion: '2.41.0',
  defaultReleaseBranch: 'production',
  majorVersion: 1,
  name: 'mijn-zaken',
  /* Runtime dependencies of this module. */
  deps: [
    '@aws-sdk/client-dynamodb',
    '@aws-sdk/client-secrets-manager',
    '@gemeentenijmegen/projen-project-type',
    '@gemeentenijmegen/apiclient',
    '@gemeentenijmegen/apigateway-http',
    '@gemeentenijmegen/session',
    '@gemeentenijmegen/utils',
    '@aws-cdk/aws-apigatewayv2-alpha',
    '@aws-cdk/aws-apigatewayv2-integrations-alpha',
    '@aws-solutions-constructs/aws-lambda-dynamodb',
    'mustache',
    'axios',
    'jsonwebtoken'
  ],
  devDeps: [
    '@types/aws-lambda',
    '@types/jsonwebtoken',
    'jest-aws-client-mock',
    'copyfiles',
    '@glen/jest-raw-loader',
    'axios-mock-adapter',
    '@aws-sdk/client-ssm',
    'dotenv',
    'axios-mock-adapter'
  ],
  mutableBuild: true,
  jestOptions: {
    jestConfig: {
      setupFiles: ['dotenv/config'],
      moduleFileExtensions: [
        'js', 'json', 'jsx', 'ts', 'tsx', 'node', 'mustache',
      ],
      transform: {
        '\\.[jt]sx?$': 'ts-jest',
        '^.+\\.mustache$': '@glen/jest-raw-loader',
      },
      testPathIgnorePatterns: ['/node_modules/', '/cdk.out', '/test/playwright'],
      roots: ['src', 'test'],
    },
  },
  eslintOptions: {
    devdirs: ['src/app/zaken/tests', '/test', '/build-tools'],
  },
  bundlerOptions: {
    loaders: {
      mustache: 'text',
    },
  },
  gitignore: [
    '.env',
    '.vscode',
    'src/app/**/shared',
    '.DS_Store',
    'src/app/**/tests/output',
  ],
});
project.synth();
