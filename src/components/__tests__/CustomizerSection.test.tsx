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
    expect(screen.getByText('Black')).toBeInTheDocument();
  });

  it('should change garment color when color pill is clicked', () => {
    render(<CustomizerSection onOpenQuote={() => {}} />);

    const crimsonBtn = screen.getByTitle('Red');
    fireEvent.click(crimsonBtn);

    expect(screen.getByText('Red')).toBeInTheDocument();
  });

  it('should add an image layer when a sample logo is clicked', () => {
    const { container } = render(<CustomizerSection onOpenQuote={() => {}} />);

    const sampleLogoBtn = screen.getByText('Golden Tiger Crest');
    fireEvent.click(sampleLogoBtn);

    const image = container.querySelector('image[href*="photo-1534438327276"]');
    expect(image).not.toBeNull();
    expect(screen.getByText('Layers (1)')).toBeInTheDocument();
  });

  it('should add a text layer when "Add text" is clicked', () => {
    render(<CustomizerSection onOpenQuote={() => {}} />);

    fireEvent.click(screen.getByRole('button', { name: /Add text/i }));

    expect(screen.getByText('Layers (1)')).toBeInTheDocument();
    expect(screen.getByDisplayValue('YOUR TEXT')).toBeInTheDocument();
  });

  it('should delete a layer from the layers panel', () => {
    render(<CustomizerSection onOpenQuote={() => {}} />);

    fireEvent.click(screen.getByRole('button', { name: /Add text/i }));
    expect(screen.getByText('Layers (1)')).toBeInTheDocument();

    fireEvent.click(screen.getByTitle('Delete'));
    expect(screen.queryByText(/Layers \(/)).not.toBeInTheDocument();
  });

  it('should undo adding a text layer', () => {
    render(<CustomizerSection onOpenQuote={() => {}} />);

    fireEvent.click(screen.getByRole('button', { name: /Add text/i }));
    expect(screen.getByText('Layers (1)')).toBeInTheDocument();

    fireEvent.click(screen.getByTitle('Undo'));
    expect(screen.queryByText(/Layers \(/)).not.toBeInTheDocument();
  });

  it('should invoke onOpenQuote with customizer notes when quote button is clicked', () => {
    const handleOpenQuote = vi.fn();
    render(<CustomizerSection onOpenQuote={handleOpenQuote} />);

    // Select Red
    fireEvent.click(screen.getByTitle('Red'));

    // Click Request Quote button
    const quoteButton = screen.getByRole('button', {
      name: /Request Quote For This Custom Mockup/i,
    });
    fireEvent.click(quoteButton);

    expect(handleOpenQuote).toHaveBeenCalledTimes(1);
    expect(handleOpenQuote).toHaveBeenCalledWith(
      'Next Level 3600',
      expect.stringContaining('Color: Red')
    );
  });

  it('should keep front and back layers independent when switching sides', () => {
    render(<CustomizerSection onOpenQuote={() => {}} />);

    // Add a text layer while on the Front side (default)
    fireEvent.click(screen.getByRole('button', { name: /Add text/i }));
    expect(screen.getByText('Layers (1)')).toBeInTheDocument();

    // Switch to Back — should show no layers, and the panel should disappear
    fireEvent.click(screen.getByRole('button', { name: /^Back/i }));
    expect(screen.queryByText(/Layers \(/)).not.toBeInTheDocument();

    // Add a layer on the Back side
    fireEvent.click(screen.getByRole('button', { name: /Add text/i }));
    expect(screen.getByText('Layers (1)')).toBeInTheDocument();

    // Switch back to Front — the original front layer should still be there
    fireEvent.click(screen.getByRole('button', { name: /^Front/i }));
    expect(screen.getByText('Layers (1)')).toBeInTheDocument();
  });

  it('should show the Full Back placement hint only on the Back side', () => {
    render(<CustomizerSection onOpenQuote={() => {}} />);

    expect(screen.getByText(/Front Chest/i)).toBeInTheDocument();
    expect(screen.queryByText(/full back print area/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^Back/i }));
    expect(screen.getByText(/full back print area/i)).toBeInTheDocument();
  });

  it('should reset customizer controls when reset button is clicked', () => {
    render(<CustomizerSection onOpenQuote={() => {}} />);

    // Change color to Red
    fireEvent.click(screen.getByTitle('Red'));
    expect(screen.getByText('Red')).toBeInTheDocument();

    // Click Reset button
    const resetButton = screen.getByRole('button', { name: /Reset/i });
    fireEvent.click(resetButton);

    expect(screen.getByText('Black')).toBeInTheDocument();
  });
});
