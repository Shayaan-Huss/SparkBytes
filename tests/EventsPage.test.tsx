import { render, screen, waitFor } from '@testing-library/react';
import EventsPage from '../app/events/page';
import { act } from 'react';

jest.mock('../lib/supabaseClient', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        order: jest.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    })),
    auth: {
      getUser: jest.fn(() => Promise.resolve({ data: { user: { id: 'mock-user' } } })),
    },
    channel: jest.fn(() => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn(),
    })),
    removeChannel: jest.fn(),
  },
}));

test('renders Events heading', async () => {
  await act(async () => {
    render(<EventsPage />);
  });

  await waitFor(() =>
    expect(
      screen.getByRole('heading', { name: 'Events' })
    ).toBeInTheDocument()
  );
});
