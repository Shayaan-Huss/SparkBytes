
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import EventsPage from '../app/events/page';
import '@testing-library/jest-dom';

jest.mock('@/lib/supabaseClient', () => {
  const insertMock = jest.fn().mockResolvedValue({ error: null });

  return {
    supabase: {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'test-user' } },
        }),
      },
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          order: jest.fn().mockResolvedValue({ data: [], error: null }),
        })),
        insert: insertMock,
      })),
      channel: jest.fn(() => ({
        on: jest.fn(() => ({
          subscribe: jest.fn(),
        })),
      })),
      removeChannel: jest.fn(),
    },
  };
});

describe('EventsPage', () => {
  it('renders and creates an event successfully', async () => {
    await act(async () => {
      render(<EventsPage />);
    });

    fireEvent.click(screen.getByText('+ Create Event'));

    fireEvent.change(screen.getByPlaceholderText('Title'), {
      target: { value: 'Test Event' },
    });
    fireEvent.change(screen.getByPlaceholderText('Description'), {
      target: { value: 'This is a test event' },
    });
    fireEvent.change(screen.getByPlaceholderText('Capacity'), {
      target: { value: '30' },
    });
    fireEvent.change(screen.getByPlaceholderText('Date'), {
      target: { value: '2025-12-01' },
    });
    fireEvent.change(screen.getByPlaceholderText('Start Time'), {
      target: { value: '10:00' },
    });
    fireEvent.change(screen.getByPlaceholderText('End Time'), {
      target: { value: '12:00' },
    });
    fireEvent.change(screen.getByPlaceholderText('Location'), {
      target: { value: 'Auditorium' },
    });

    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(screen.getByText(/event created successfully/i)).toBeInTheDocument();
    });
  });
});
