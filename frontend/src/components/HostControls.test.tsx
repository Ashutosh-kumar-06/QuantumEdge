import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import HostControls from './HostControls';

describe('HostControls Component', () => {
  const mockRoomState = {
    owner: 'user1',
    participants: {
      'user2': { canEdit: false, canMic: true, canCam: false }
    }
  };

  it('renders nothing if current user is not owner', () => {
    const { container } = render(<HostControls currentUser="user2" roomState={mockRoomState} onUpdatePermission={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders controls if current user is owner', () => {
    render(<HostControls currentUser="user1" roomState={mockRoomState} onUpdatePermission={() => {}} />);
    expect(screen.getByText('👑 Host Controls')).toBeInTheDocument();
    expect(screen.getByText('user2')).toBeInTheDocument();
  });

  it('calls onUpdatePermission when checkbox is clicked', () => {
    const mockToggle = vi.fn();
    render(<HostControls currentUser="user1" roomState={mockRoomState} onUpdatePermission={mockToggle} />);
    
    // Find the edit checkbox
    const checkboxes = screen.getAllByRole('checkbox');
    // first is edit, second is mic, third is cam
    fireEvent.click(checkboxes[0]);
    
    expect(mockToggle).toHaveBeenCalledWith('user2', { canEdit: true });
  });
});
