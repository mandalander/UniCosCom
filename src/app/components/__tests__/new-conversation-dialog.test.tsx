import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NewConversationDialog } from '../new-conversation-dialog';

// Mock dependencies
jest.mock('@/firebase', () => ({
    useUser: jest.fn(),
    useFirestore: jest.fn(),
}));

jest.mock('../language-provider', () => ({
    useLanguage: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
    collection: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    getDocs: jest.fn(),
    doc: jest.fn(),
    setDoc: jest.fn(),
    serverTimestamp: jest.fn(),
}));

// Import mocks to setup return values
import { useUser, useFirestore } from '@/firebase';
import { useLanguage } from '../language-provider';
import { getDocs } from 'firebase/firestore';

describe('NewConversationDialog', () => {
    const mockOnConversationCreated = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        (useUser as jest.Mock).mockReturnValue({
            user: { uid: 'test-user-id', displayName: 'Test User' },
        });
        (useFirestore as jest.Mock).mockReturnValue({});
        (useLanguage as jest.Mock).mockReturnValue({
            t: (key: string) => key,
        });
    });

    it('renders the dialog trigger button', () => {
        render(<NewConversationDialog onConversationCreated={mockOnConversationCreated} />);
        // The trigger is a ghost button with a Plus icon. 
        // We can find it by role 'button' since it's the only one initially.
        const button = screen.getByRole('button');
        expect(button).toBeInTheDocument();
    });

    it('opens the dialog when trigger is clicked', () => {
        render(<NewConversationDialog onConversationCreated={mockOnConversationCreated} />);
        const button = screen.getByRole('button');
        fireEvent.click(button);

        expect(screen.getByText('newConversation')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('searchUsers')).toBeInTheDocument();
    });

    it('searches for users when typing', async () => {
        (getDocs as jest.Mock).mockResolvedValue({
            docs: [
                {
                    id: 'other-user-id',
                    data: () => ({ displayName: 'Other User', photoURL: null }),
                },
            ],
        });

        render(<NewConversationDialog onConversationCreated={mockOnConversationCreated} />);
        const button = screen.getByRole('button');
        fireEvent.click(button);

        const input = screen.getByPlaceholderText('searchUsers');
        fireEvent.change(input, { target: { value: 'Other' } });

        await waitFor(() => {
            expect(getDocs).toHaveBeenCalled();
        });

        expect(screen.getByText('Other User')).toBeInTheDocument();
    });
});
