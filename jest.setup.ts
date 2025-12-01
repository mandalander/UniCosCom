import '@testing-library/jest-dom'
import React from 'react';

jest.mock('lucide-react', () => ({
    X: () => React.createElement('svg', { 'data-testid': 'icon-x' }),
    Search: () => React.createElement('svg', { 'data-testid': 'icon-search' }),
    Plus: () => React.createElement('svg', { 'data-testid': 'icon-plus' }),
    Loader2: () => React.createElement('svg', { 'data-testid': 'icon-loader' }),
    MessageSquarePlus: () => React.createElement('svg', { 'data-testid': 'icon-message-plus' }),
    ArrowLeft: () => React.createElement('svg', { 'data-testid': 'icon-arrow-left' }),
    Send: () => React.createElement('svg', { 'data-testid': 'icon-send' }),
}));
