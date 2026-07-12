import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AiTutorChat from './AiTutorChat';

describe('AiTutorChat Component', () => {
  it('renders the initial feedback message', () => {
    render(<AiTutorChat onClose={() => {}} codeContext="print(1)" initialFeedback="Looks good!" />);
    expect(screen.getByText('Looks good!')).toBeInTheDocument();
  });

  it('allows user to type a message', () => {
    render(<AiTutorChat onClose={() => {}} codeContext="print(1)" />);
    const input = screen.getByPlaceholderText('Ask a follow-up question...');
    fireEvent.change(input, { target: { value: 'How does this work?' } });
    expect(input).toHaveValue('How does this work?');
  });

  it('calls onClose when the close button is clicked', () => {
    const mockClose = vi.fn();
    render(<AiTutorChat onClose={mockClose} codeContext="print(1)" />);
    
    // The close button has the text '✕'
    const closeBtn = screen.getByText('✕');
    fireEvent.click(closeBtn);
    
    expect(mockClose).toHaveBeenCalledTimes(1);
  });
});
