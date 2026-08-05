import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockGetUser = vi.fn();

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
  })),
}));

import { updateSession } from './supabase-middleware';

function buildRequest(pathname: string) {
  return new NextRequest(new Request(`http://localhost:3000${pathname}`));
}

describe('updateSession', () => {
  beforeEach(() => {
    mockGetUser.mockReset();
  });

  it('redirects to /admin/login when there is no user and the path is not the login route', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const response = await updateSession(buildRequest('/admin'));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost:3000/admin/login');
  });

  it('passes through when there is no user and the path is the login route', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const response = await updateSession(buildRequest('/admin/login'));

    expect(response.status).not.toBe(307);
    expect(response.headers.get('location')).toBeNull();
  });

  it('allows access to /admin/login even when a user session exists so password re-entry is required', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });

    const response = await updateSession(buildRequest('/admin/login'));

    expect(response.status).not.toBe(307);
    expect(response.headers.get('location')).toBeNull();
  });

  it('passes through when there is a user and the path is not the login route', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });

    const response = await updateSession(buildRequest('/admin'));

    expect(response.status).not.toBe(307);
    expect(response.headers.get('location')).toBeNull();
  });
});
