import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TrackStatusModal } from '../TrackStatusModal';

// Mock Supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    }),
  },
}));

describe('TrackStatusModal Component', () => {
  it('should not render anything when isOpen is false', () => {
    const { container } = render(
      <TrackStatusModal isOpen={false} onClose={() => {}} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render correctly when isOpen is true', () => {
    render(<TrackStatusModal isOpen={true} onClose={() => {}} />);
    expect(screen.getByText(/Check Quote Status/i)).toBeInTheDocument();
  });

  it('should display error message when submitted with invalid/unknown protocol', async () => {
    render(<TrackStatusModal isOpen={true} onClose={() => {}} />);

    const input = screen.getByPlaceholderText(/e.g. CS-2026-8942/i);
    const submitButton = screen.getByRole('button', { name: /^Track$/i });

    fireEvent.change(input, { target: { value: 'UNKNOWN-999' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/No quote inquiry found matching protocol code/i)
      ).toBeInTheDocument();
    });
  });

  it('should display order progress when valid demo protocol CS-2026-8942 is submitted', async () => {
    render(<TrackStatusModal isOpen={true} onClose={() => {}} />);

    const input = screen.getByPlaceholderText(/e.g. CS-2026-8942/i);
    const submitButton = screen.getByRole('button', { name: /^Track$/i });

    fireEvent.change(input, { target: { value: 'CS-2026-8942' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Gracie Barra Downtown')).toBeInTheDocument();
      expect(screen.getByText('30 pcs')).toBeInTheDocument();
      expect(screen.getByText(/Artwork Vectoring & DTF Sizing/i)).toBeInTheDocument();
    });
  });

  it('should invoke onClose callback when close button is clicked', () => {
    const handleClose = vi.fn();
    render(<TrackStatusModal isOpen={true} onClose={handleClose} />);

    // Click the X close button
    const closeButtons = screen.getAllByRole('button');
    fireEvent.click(closeButtons[0]);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
