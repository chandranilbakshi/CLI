import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { StoredCredentials } from '../types.js';

// refreshAccessToken reads/writes credentials via ./config.js. Mock it so we
// can assert the state transition without touching disk or the network.
const configMock = vi.hoisted(() => ({
  getCredentials: vi.fn(),
  saveCredentials: vi.fn(),
  getPlatformApiUrl: vi.fn(() => 'https://api.test'),
  getGlobalConfig: vi.fn(() => ({ platform_api_url: 'https://api.test' })),
  getProjectConfig: vi.fn(() => null),
  FAKE_PROJECT_ID: 'fa4e0000-1234-5678-90ab-cd1234567890',
}));
vi.mock('./config.js', () => configMock);

import { refreshAccessToken } from './credentials.js';

const user = {} as unknown as StoredCredentials['user'];

describe('refreshAccessToken — legacy exchange-PAT → direct migration', () => {
  beforeEach(() => vi.clearAllMocks());

  it('promotes {access_token: jwt, refresh_token: uak_} to {user_api_key: uak_} with the other fields cleared', async () => {
    configMock.getCredentials.mockReturnValue({
      access_token: 'old-jwt',
      refresh_token: 'uak_legacy123',
      user,
    } satisfies StoredCredentials);

    const token = await refreshAccessToken();

    // Returns the key itself (no exchange, no network) and rewrites the file
    // into the clean direct-auth shape.
    expect(token).toBe('uak_legacy123');
    expect(configMock.saveCredentials).toHaveBeenCalledTimes(1);
    expect(configMock.saveCredentials).toHaveBeenCalledWith({
      access_token: '',
      refresh_token: '',
      user_api_key: 'uak_legacy123',
      user,
    });
  });

  it('throws a re-login error for a direct-key session (a uak_ cannot be refreshed) and does not rewrite creds', async () => {
    configMock.getCredentials.mockReturnValue({
      access_token: '',
      refresh_token: '',
      user_api_key: 'uak_direct',
      user,
    } satisfies StoredCredentials);

    await expect(refreshAccessToken()).rejects.toThrow(/invalid, revoked, or expired/i);
    expect(configMock.saveCredentials).not.toHaveBeenCalled();
  });
});
