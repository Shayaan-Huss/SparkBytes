/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import EventsPage from '@/app/events/page'
import { act } from 'react'
import '@testing-library/jest-dom'

jest.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        order: jest.fn(() => ({
          throwOnError: jest.fn(() => ({
            data: [],
            error: null,
          })),
        })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => ({
            data: {},
            error: null,
          })),
        })),
      })),
    })),
  },
}))

describe('EventsPage', () => {
  it('renders without crashing', async () => {
    await act(async () => {
      render(<EventsPage />)
    })

    expect(screen.getByText('Events')).toBeInTheDocument()
    expect(screen.getByText('Upcoming Events')).toBeInTheDocument()
  })

  it('creates an event successfully', async () => {
    await act(async () => {
      render(<EventsPage />)
    })

    fireEvent.change(screen.getByPlaceholderText('Title'), {
      target: { value: 'Test Event' },
    })
    fireEvent.change(screen.getByPlaceholderText('Description'), {
      target: { value: 'This is a test.' },
    })
    fireEvent.change(screen.getByPlaceholderText('Capacity'), {
      target: { value: '50' },
    })
    fireEvent.change(screen.getByPlaceholderText('Location'), {
      target: { value: 'Room 101' },
    })

    // Time and date inputs
    const dateInput = screen.getByDisplayValue('')
    fireEvent.change(dateInput, {
      target: { value: '2025-11-20' },
    })

    const timeInputs = screen.getAllByDisplayValue('')
    fireEvent.change(timeInputs[1], {
      target: { value: '14:00' },
    })
    fireEvent.change(timeInputs[2], {
      target: { value: '16:00' },
    })

    fireEvent.click(screen.getByRole('button', { name: /create/i }))

    await waitFor(() => {
      expect(screen.getByText(/event created successfully/i)).toBeInTheDocument()
    })
  })
})
