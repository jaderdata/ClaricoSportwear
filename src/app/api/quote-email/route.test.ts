import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from './route';

const mockSend = vi.fn();

// Mock Resend class constructor
vi.mock('resend', () => {
  return {
    Resend: class MockResend {
      emails = {
        send: mockSend,
      };
    },
  };
});

describe('POST /api/quote-email', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    mockSend.mockResolvedValue({ id: 'mock_email_id' });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  const validPayload = {
    protocol: 'CLA-2026-9876',
    full_name: 'Carlos Gracie',
    academy_name: 'Gracie Barra Downtown',
    email: 'carlos@gracie.com',
    whatsapp: '+55 11 99999-8888',
    quantity: 50,
    event_name: 'State Championship 2026',
    discount_code: 'JITSU10',
    notes: 'Need high-res DTF print on back',
    logo_urls: ['https://example.com/logo.png'],
  };

  it('should return 400 when required fields are missing', async () => {
    const incompletePayload = {
      protocol: 'CLA-2026-9876',
      // missing email, full_name, academy_name
    };

    const req = new Request('http://localhost/api/quote-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(incompletePayload),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data).toEqual({
      error: 'Missing required fields for email dispatch',
    });
  });

  it('should process email dispatch in simulation mode when RESEND_API_KEY is not set', async () => {
    delete process.env.RESEND_API_KEY;
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const req = new Request('http://localhost/api/quote-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validPayload),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.protocol).toBe('CLA-2026-9876');
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[TRANSACTIONAL EMAIL DISPATCH SIMULATION]')
    );

    consoleSpy.mockRestore();
  });

  it('should dispatch emails via Resend when RESEND_API_KEY is configured', async () => {
    process.env.RESEND_API_KEY = 're_123456789_mock_key';

    const req = new Request('http://localhost/api/quote-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validPayload),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.protocol).toBe('CLA-2026-9876');
    expect(data.message).toBe('Transactional email processed successfully.');
    expect(mockSend).toHaveBeenCalledTimes(2);
  });

  it('should handle thrown errors gracefully and return 500 status', async () => {
    const invalidJsonReq = new Request('http://localhost/api/quote-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid-json-body{',
    });

    const res = await POST(invalidJsonReq);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data).toHaveProperty('error');
  });
});
