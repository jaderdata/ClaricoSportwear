import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CustomizerSection } from '../CustomizerSection';

describe('CustomizerSection Component', () => {
  it('should render studio title and initial controls correctly', () => {
    render(<CustomizerSection onOpenQuote={() => {}} />);
    expect(screen.getByText(/Interactive Mockup Studio/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Preview Your Academy Shirts/i)
    ).toBeInTheDocument();
    expect(screen.getByText('Pitch Black')).toBeInTheDocument();
  });

  it('should change garment color when color pill is clicked', () => {
    render(<CustomizerSection onOpenQuote={() => {}} />);

    const crimsonBtn = screen.getByTitle('Crimson Red');
    fireEvent.click(crimsonBtn);

    expect(screen.getByText('Crimson Red')).toBeInTheDocument();
  });

  it('should select sample logo when clicked', () => {
    render(<CustomizerSection onOpenQuote={() => {}} />);

    const sampleLogoBtn = screen.getByText('Golden Tiger Crest');
    fireEvent.click(sampleLogoBtn);

    expect(screen.getByAltText('Custom Print Logo')).toBeInTheDocument();
  });

  it('should invoke onOpenQuote with customizer notes when quote button is clicked', () => {
    const handleOpenQuote = vi.fn();
    render(<CustomizerSection onOpenQuote={handleOpenQuote} />);

    // Select Crimson Red
    fireEvent.click(screen.getByTitle('Crimson Red'));

    // Click Request Quote button
    const quoteButton = screen.getByRole('button', {
      name: /Request Quote For This Custom Mockup/i,
    });
    fireEvent.click(quoteButton);

    expect(handleOpenQuote).toHaveBeenCalledTimes(1);
    expect(handleOpenQuote).toHaveBeenCalledWith(
      'Gildan 3600 Classic Crew',
      expect.stringContaining('Color: Crimson Red')
    );
  });

  it('should reset customizer controls when reset button is clicked', () => {
    render(<CustomizerSection onOpenQuote={() => {}} />);

    // Change color to Crimson Red
    fireEvent.click(screen.getByTitle('Crimson Red'));
    expect(screen.getByText('Crimson Red')).toBeInTheDocument();

    // Click Reset button
    const resetButton = screen.getByRole('button', { name: /Reset/i });
    fireEvent.click(resetButton);

    expect(screen.getByText('Pitch Black')).toBeInTheDocument();
  });
});
