import { getConfiguration } from '../src/Configuration';

describe('Test configuration', () => {
  test('Branch name matches key', async() => {
    expect(getConfiguration('acceptance').name).toBe('acceptance');
  });

  test('Branch name is different from environment key', async() => {
    expect(getConfiguration('main').name).toBe('production');
  });
});
