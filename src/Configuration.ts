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

  /**
   * Feature flag: if this is not true, the lambda will
   * return 404.
   */
  readonly isLive?: boolean;

  /**
   * Feature flag: The taken functionality is experimental
   * If this flag is not true, the taken-functionality will
   * always exit immediately.
   */
  readonly useTaken?: boolean;
}

export const configurations: {[key: string]: Configuration} = {
  acceptance: {
    branchName: 'acceptance',
    deployFromEnvironment: Statics.deploymentEnvironment,
    deployToEnvironment: Statics.acceptanceEnvironment,
    useTaken: true,
    isLive: true,
  },
  production: {
    branchName: 'main',
    deployFromEnvironment: Statics.deploymentEnvironment,
    deployToEnvironment: Statics.productionEnvironment,
    useTaken: false,
    isLive: false,
  },
};

export function getConfiguration(branchName: string) {
  const config = configurations[branchName];
  if (!config) {
    throw new Error(`Configuration for branch ${branchName} not found`);
  }
  return config;
}
