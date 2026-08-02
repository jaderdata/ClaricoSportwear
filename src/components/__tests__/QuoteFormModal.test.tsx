import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QuoteFormModal } from '../QuoteFormModal';

// Mock Supabase client
const mockInsert = vi.fn().mockResolvedValue({ data: null, error: null });
const mockSelect = vi.fn().mockReturnValue({
  eq: vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue({
        data: { code: 'CLARICO10', discount_percent: 10 },
        error: null,
      }),
    }),
  }),
});

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn((table: string) => {
      if (table === 'cs_discount_codes') {
        return { select: mockSelect };
      }
      return { insert: mockInsert };
    }),
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({
          data: { path: 'CS-2026-1000/logo.png' },
          error: null,
        }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: 'https://example.com/storage/logo.png' },
        }),
      }),
    },
  },
}));

describe('QuoteFormModal Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);

    if (!global.URL.createObjectURL) {
      global.URL.createObjectURL = vi.fn(() => 'blob:mock-preview-url');
    }
  });

  it('should not render anything when isOpen is false', () => {
    const { container } = render(
      <QuoteFormModal isOpen={false} onClose={() => {}} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render form fields correctly when isOpen is true', () => {
    render(<QuoteFormModal isOpen={true} onClose={() => {}} />);
    expect(screen.getByText(/Create Your Gym Line/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e\.g\., Prof\. Rafael Silva/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e\.g\., Gracie Barra Downtown/i)).toBeInTheDocument();
  });

  it('should display error when uploading invalid file extension', async () => {
    render(<QuoteFormModal isOpen={true} onClose={() => {}} />);

    const invalidFile = new File(['dummy content'], 'document.txt', {
      type: 'text/plain',
    });

    const fileInput = document.querySelector('#logo-file-input')!;
    fireEvent.change(fileInput, { target: { files: [invalidFile] } });

    await waitFor(() => {
      expect(
        screen.getByText(/Invalid file format: \.txt/i)
      ).toBeInTheDocument();
    });
  });

  it('should display DPI warning when uploading small PNG image', async () => {
    render(<QuoteFormModal isOpen={true} onClose={() => {}} />);

    const smallPng = new File([new ArrayBuffer(100 * 1024)], 'small_logo.png', {
      type: 'image/png',
    });

    const fileInput = document.querySelector('#logo-file-input')!;
    fireEvent.change(fileInput, { target: { files: [smallPng] } });

    await waitFor(() => {
      expect(
        screen.getByText(/Low resolution detected/i)
      ).toBeInTheDocument();
    });
  });

  it('should apply discount code successfully', async () => {
    render(<QuoteFormModal isOpen={true} onClose={() => {}} />);

    const discountInput = screen.getByPlaceholderText(/e\.g\. CLARICO10/i);
    const applyButton = screen.getByRole('button', { name: /^Apply$/i });

    fireEvent.change(discountInput, { target: { value: 'CLARICO10' } });
    fireEvent.click(applyButton);

    await waitFor(() => {
      expect(screen.getByText(/Code CLARICO10 applied!/i)).toBeInTheDocument();
    });
  });

  it('should submit quote form and present tracking protocol on success', async () => {
    render(<QuoteFormModal isOpen={true} onClose={() => {}} />);

    // Fill form fields
    fireEvent.change(screen.getByPlaceholderText(/e\.g\., Prof\. Rafael Silva/i), {
      target: { value: 'Rafael Mendes' },
    });
    fireEvent.change(screen.getByPlaceholderText(/e\.g\., Gracie Barra Downtown/i), {
      target: { value: 'AOJ Academy' },
    });
    fireEvent.change(screen.getByPlaceholderText(/rafael@academy\.com/i), {
      target: { value: 'rafael@aoj.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/\+1 \(555\) 019-2834/i), {
      target: { value: '+55 11 98888-7777' },
    });

    // Submit form via submit event
    const form = document.querySelector('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText(/Quote Request Received!/i)).toBeInTheDocument();
      expect(screen.getByText(/Your Tracking Protocol/i)).toBeInTheDocument();
      expect(mockInsert).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/quote-email',
        expect.objectContaining({ method: 'POST' })
      );
    });
  });
});
