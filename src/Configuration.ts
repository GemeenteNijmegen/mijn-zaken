import { Statics } from './statics';

export interface Environment {
  account: string;
  region: string;
}

export interface Configurable {
  configuration: Configuration;
}

export interface Configuration {
  name: string; // Name (for the pipeline)
  branchName: string; // Branch (for the source)
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

  /**
   * Feature flag: The submissions functionality is experimental
   * If this flag is not true, the submissions-functionality will
   * not be called.
   */
  readonly useSubmissions?: boolean;

  /**
   * Allow zaken from these 'domains'. These values are added to
   * a call to `Zaken.allowDomains` which checks the 'zaakType'
   * for each zaak for its 'domein', and only shows zaken
   * from the allowed list.
   */
  readonly allowZakenDomains: string[];
}

export const configurations: {[key: string]: Configuration} = {
  acceptance: {
    branchName: 'acceptance',
    name: 'acceptance',
    deployFromEnvironment: Statics.deploymentEnvironment,
    deployToEnvironment: Statics.acceptanceEnvironment,
    useTaken: true,
    isLive: true,
    useSubmissions: true,
    allowZakenDomains: ['APV', 'JZ'],
  },
  production: {
    branchName: 'main',
    name: 'production',
    deployFromEnvironment: Statics.deploymentEnvironment,
    deployToEnvironment: Statics.productionEnvironment,
    useTaken: false,
    isLive: true,
    useSubmissions: false,
    allowZakenDomains: ['APV'], // JZ is not yet available in prod
  },
};

/**
 * Get a configuration object based on the `branchName` key
 * @param branchName branch Name for which to get config
 */
export function getConfiguration(branchName: string): Configuration {
  const configName = Object.keys(configurations).find((configurationName) => {
    const config = configurations[configurationName];
    return config.branchName == branchName;
  });
  if (configName) {
    return configurations[configName];
  }
  throw Error(`No configuration found for branch name ${branchName}`);
}
