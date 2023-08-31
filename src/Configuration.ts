import { Statics } from './statics';

export interface Environment {
  account: string;
  region: string;
}

export interface Configurable {
  configuration: Configuration;
}

export interface Configuration {
  branchName: string;
  deployFromEnvironment: Environment;
  deployToEnvironment: Environment;
}

export const configurations: {[key: string]: Configuration} = {
  acceptance: {
    branchName: 'acceptance',
    deployFromEnvironment: Statics.deploymentEnvironment,
    deployToEnvironment: Statics.acceptanceEnvironment,
  },
};

export function getConfiguration(branchName: string) {
  const config = configurations[branchName];
  if (!config) {
    throw new Error(`Configuration for branch ${branchName} not found`);
  }
  return config;
}
