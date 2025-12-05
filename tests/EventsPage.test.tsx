import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EventsPage from '@/events/page';
import { act } from 'react';
import '@testing-library/jest-dom';

// Mock Supabase
jest.mock('@/lib/supabaseClient', () => {
  const mockInsert = jest.fn().mockResolvedValue({ error: null });

  return {
    supabase: {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: '08758a0f-bc75-4c58-975c-a60bde06e44d' } },
        }),
      },
      from: jest.fn((tableName: string) => {
        if (tableName === 'events') {
          return {
            select: jest.fn(() => ({
              order: jest.fn(() =>
                Promise.resolve({
                  data: [
                    {
                      id: '1',
                      title: 'Mock Event',
                      description: 'Event Desc',
                      location: 'Room A',
                      event_date: '2025-12-10',
                      start_time: '13:00',
                      end_time: '14:00',
                      capacity: 100,
                      creator_id: '08758a0f-bc75-4c58-975c-a60bde06e44d',
                    },
                  ],
                  error: null,
                })
              ),
            })),
            insert: mockInsert,
          };
        }

        if (tableName === 'food_items') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() =>
                Promise.resolve({
                  data: [
                    {
                      id: 123,
                      event_id: '1',
                      food_name: 'Pizza',
                      dietary_restrictions: 'Vegetarian',
                      quantity: 10,
                      calorie: 300,
                    },
                  ],
                  error: null,
                })
              ),
            })),
          };
        }

        if (tableName === 'food_reservations') {
          return {
            insert: jest.fn().mockResolvedValue({ error: null }),
          };
        }

        return {};
      }),

      channel: jest.fn(() => ({
        on: jest.fn(() => ({
          subscribe: jest.fn(() => ({})),
        })),
      })),
      removeChannel: jest.fn(),
    },
  };
});

describe('EventsPage', () => {
  it('renders EventsPage with events and food items', async () => {
    await act(async () => {
      render(<EventsPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Mock Event')).toBeInTheDocument();
      expect(screen.getByText('Pizza')).toBeInTheDocument();
    });
  });

  it('allows user to create an event', async () => {
    await act(async () => {
      render(<EventsPage />);
    });

    fireEvent.click(screen.getByText('+ Create Event'));

    fireEvent.change(screen.getByPlaceholderText('Title'), {
      target: { value: 'New Event' },
    });
    fireEvent.change(screen.getByPlaceholderText('Description'), {
      target: { value: 'Test Description' },
    });
    fireEvent.change(screen.getByPlaceholderText('Capacity'), {
      target: { value: '50' },
    });
    fireEvent.change(screen.getByTestId('event-date'), {
      target: { value: '2025-12-15' },
    });
    fireEvent.change(screen.getByPlaceholderText('Start Time'), {
      target: { value: '12:00' },
    });
    fireEvent.change(screen.getByPlaceholderText('End Time'), {
      target: { value: '13:00' },
    });
    fireEvent.change(screen.getByPlaceholderText('Location'), {
      target: { value: 'Cafeteria' },
    });

    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(screen.getByText(/event created successfully/i)).toBeInTheDocument();
    });
  });

  it('allows user to reserve food', async () => {
    await act(async () => {
      render(<EventsPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Reserve')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Reserve'));

    await waitFor(() => {
      expect(screen.getByText(/food reserved successfully/i)).toBeInTheDocument();
    });
  });
});
