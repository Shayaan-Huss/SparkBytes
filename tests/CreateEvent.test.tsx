import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EventsPage from '../app/events/page';

describe('EventsPage', () => {
  it('renders Create Event button initially', () => {
    render(<EventsPage />);
    expect(screen.getByText('+ Create Event')).toBeInTheDocument();
  });

  it('shows the form when Create Event is clicked', () => {
    render(<EventsPage />);
    fireEvent.click(screen.getByText('+ Create Event'));
    expect(screen.getByText('Create an Event')).toBeInTheDocument();
  });

  it('shows error popup if fields are empty on submit', () => {
    render(<EventsPage />);
    fireEvent.click(screen.getByText('+ Create Event'));
    fireEvent.click(screen.getByText('Submit'));
    expect(screen.getByText('Please fill in all fields.')).toBeInTheDocument();
  });

  it('shows success message on valid submission', async () => {
    render(<EventsPage />);
    fireEvent.click(screen.getByText('+ Create Event'));

    fireEvent.change(screen.getByPlaceholderText('Title'), { target: { value: 'Test Event' } });
    fireEvent.change(screen.getByPlaceholderText('Description'), { target: { value: 'This is a test.' } });
    fireEvent.change(screen.getByPlaceholderText('Capacity'), { target: { value: '50' } });
    fireEvent.change(screen.getByPlaceholderText('Location'), { target: { value: 'Room 101' } });
    fireEvent.change(screen.getByDisplayValue(''), { target: { value: '2025-12-25' } }); // date
    fireEvent.change(screen.getByDisplayValue(''), { target: { value: '12:00' } }); // time

    fireEvent.click(screen.getByText('Submit'));

    expect(await screen.findByText('Event created successfully!')).toBeInTheDocument();
  });

  it('closes popup on click', async () => {
    render(<EventsPage />);
    fireEvent.click(screen.getByText('+ Create Event'));
    fireEvent.click(screen.getByText('Submit'));
    const popup = screen.getByText('Please fill in all fields.');
    fireEvent.click(popup);
    expect(popup).not.toBeInTheDocument();
  });
});
