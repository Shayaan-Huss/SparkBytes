"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

interface Event {
  id: string;
  title: string;
  description: string;
  location: string;
  event_date: string;
  start_time: string;
  end_time: string;
  capacity: number;
  creator_id: string;
}

function EventsPage() {
  const [formVisible, setFormVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [capacity, setCapacity] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [popupMessage, setPopupMessage] = useState('');
  const [popupType, setPopupType] = useState<'success' | 'error' | ''>('');

  useEffect(() => {
    fetchEvents();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('events-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events'
        },
        () => {
          fetchEvents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: true });

      if (error) throw error;

      setEvents(data || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!title || !description || !capacity || !date || !startTime || !endTime || !location) {
      setPopupType('error');
      setPopupMessage('Please fill in all fields.');
      return;
    }

    try {
      //Commented out to test the create event form

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setPopupType('error');
        setPopupMessage('You must be logged in to create an event.');
        return;
      }

      const { error } = await supabase
        .from('events')
        .insert([
          {
            title,
            description,
            capacity: parseInt(capacity),
            event_date: date,
            start_time: startTime,
            end_time: endTime,
            location,
            creator_id: user.id
          }
        ]);

      if (error) throw error;

      setPopupType('success');
      setPopupMessage('Event created successfully!');

      // Reset form
      setTitle('');
      setDescription('');
      setCapacity('');
      setDate('');
      setStartTime('');
      setEndTime('');
      setLocation('');
      setFormVisible(false);

      // Refresh events list
      fetchEvents();
    } catch (err) {
      setPopupType('error');
      setPopupMessage(err instanceof Error ? err.message : 'Failed to create event');
    }
  };

  const closePopup = () => {
    setPopupMessage('');
    setPopupType('');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

{/* <style jsx>{`
  input,
  textarea {
    color: #374151;
  }

  input::placeholder,
  textarea::placeholder {
    color: #6b7280;
    opacity: 1;
  }
`}</style> */}

  return (
    <div style={styles.pageContainer}>
      <h1 style={styles.pageTitle}>Events</h1>

      {!formVisible ? (
        <button style={styles.createButton} onClick={() => setFormVisible(true)}>
          + Create Event
        </button>
      ) : (
        <form style={styles.formContainer} onSubmit={handleSubmit}>
          <h2 style={styles.formTitle}>Create an Event</h2>

          <input
            type="text"
            placeholder="Title"
            value={title}
            style={styles.input}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            placeholder="Description"
            value={description}
            style={styles.textarea}
            onChange={(e) => setDescription(e.target.value)}
          />
          <input
            type="number"
            placeholder="Capacity"
            value={capacity}
            style={styles.input}
            onChange={(e) => setCapacity(e.target.value)}
          />
          <input
            type="date"
            value={date}
            style={styles.input}
            onChange={(e) => setDate(e.target.value)}
          />
          <input
            type="time"
            placeholder="Start Time"
            value={startTime}
            style={styles.input}
            onChange={(e) => setStartTime(e.target.value)}
          />
          <input
            type="time"
            placeholder="End Time"
            value={endTime}
            style={styles.input}
            onChange={(e) => setEndTime(e.target.value)}
          />
          <input
            type="text"
            placeholder="Location"
            value={location}
            style={styles.input}
            onChange={(e) => setLocation(e.target.value)}
          />

          <div style={styles.formButtons}>
          <button type="button" style={styles.cancelButton} onClick={() => setFormVisible(false)}>Cancel</button>
            <button type="submit" style={styles.submitButton}>Submit</button>
          </div>
        </form>
      )}

      {popupMessage && (
        <div
          style={{
            ...styles.popup,
            backgroundColor: popupType === 'error' ? '#f8d7da' : '#d4edda',
            color: popupType === 'error' ? '#721c24' : '#155724',
            borderColor: popupType === 'error' ? '#f5c6cb' : '#c3e6cb',
          }}
          onClick={closePopup}
        >
          {popupMessage}
        </div>
      )}

      {/* Events Display Section */}
      <div style={styles.eventsSection}>
        <h2 style={styles.sectionTitle}>Upcoming Events</h2>
        
        {loading ? (
          <div style={styles.loadingContainer}>
            <div style={styles.spinner}></div>
            <p style={styles.loadingText}>Loading events...</p>
          </div>
        ) : error ? (
          <div style={styles.errorContainer}>
            <h3 style={styles.errorTitle}>Error Loading Events</h3>
            <p style={styles.errorText}>{error}</p>
            <button onClick={fetchEvents} style={styles.retryButton}>
              Try Again
            </button>
          </div>
        ) : events.length === 0 ? (
          <div style={styles.noEventsContainer}>
            <p style={styles.noEventsText}>No events found. Create one to get started!</p>
          </div>
        ) : (
          <div style={styles.eventsGrid}>
            {events.map((event) => (
              <div key={event.id} style={styles.eventCard}>
                <div style={styles.eventHeader}>
                  <h3 style={styles.eventTitle}>{event.title}</h3>
                  <span style={styles.capacityBadge}>
                    {event.capacity} spots
                  </span>
                </div>
                
                <p style={styles.eventDescription}>{event.description}</p>
                
                <div style={styles.eventDetails}>
                  <div style={styles.detailRow}>
                    <svg style={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{formatDate(event.event_date)}</span>
                  </div>
                  
                  <div style={styles.detailRow}>
                    <svg style={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{formatTime(event.start_time)} - {formatTime(event.end_time)}</span>
                  </div>
                  
                  <div style={styles.detailRow}>
                    <svg style={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{event.location}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  pageContainer: {
    fontFamily: 'Segoe UI, sans-serif',
    padding: '30px',
    backgroundColor: '#f9fafb',
    minHeight: '100vh',
  },
  pageTitle: {
    fontSize: '32px',
    marginBottom: '20px',
    textAlign: 'center',
  },
  createButton: {
    display: 'block',
    margin: '0 auto 30px',
    padding: '12px 24px',
    fontSize: '16px',
    backgroundColor: '#4f46e5',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  formContainer: {
    maxWidth: '500px',
    margin: '0 auto 40px',
    padding: '25px',
    backgroundColor: '#fff',
    borderRadius: '10px',
    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.1)',
  },
  formTitle: {
    marginBottom: '20px',
    textAlign: 'center',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    marginBottom: '12px',
    borderRadius: '5px',
    border: '1px solid #ccc',
    boxSizing: 'border-box',
    color: '#374151',
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    marginBottom: '12px',
    height: '100px',
    borderRadius: '5px',
    border: '1px solid #ccc',
    resize: 'vertical' as const,
    boxSizing: 'border-box',
    color: '#374151',
  },
  formButtons: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  submitButton: {
    padding: '10px 20px',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  cancelButton: {
    padding: '10px 20px',
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  popup: {
    margin: '20px auto',
    display: 'inline-block',
    padding: '12px 20px',
    borderRadius: '6px',
    border: '1px solid',
    cursor: 'pointer',
    transition: 'opacity 0.3s ease',
  },
  eventsSection: {
    maxWidth: '1200px',
    margin: '0 auto',
    marginTop: '40px',
  },
  sectionTitle: {
    fontSize: '28px',
    marginBottom: '24px',
    textAlign: 'center',
  },
  loadingContainer: {
    textAlign: 'center',
    padding: '60px 20px',
  },
  spinner: {
    width: '64px',
    height: '64px',
    border: '4px solid #e5e7eb',
    borderTop: '4px solid #4f46e5',
    borderRadius: '50%',
    margin: '0 auto 16px',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    color: '#6b7280',
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    padding: '24px',
    maxWidth: '500px',
    margin: '0 auto',
    textAlign: 'center',
  },
  errorTitle: {
    color: '#991b1b',
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '8px',
  },
  errorText: {
    color: '#dc2626',
    marginBottom: '16px',
  },
  retryButton: {
    padding: '8px 16px',
    backgroundColor: '#dc2626',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  noEventsContainer: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    padding: '48px 24px',
    textAlign: 'center',
  },
  noEventsText: {
    color: '#6b7280',
    fontSize: '18px',
  },
  eventsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '20px',
  },
  eventCard: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    padding: '24px',
    transition: 'box-shadow 0.3s ease',
  },
  eventHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px',
  },
  eventTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#111827',
    margin: 0,
  },
  capacityBadge: {
    backgroundColor: '#dbeafe',
    color: '#1e40af',
    fontSize: '12px',
    padding: '4px 12px',
    borderRadius: '12px',
    whiteSpace: 'nowrap',
  },
  eventDescription: {
    color: '#4b5563',
    marginBottom: '16px',
  },
  eventDetails: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  detailRow: {
    display: 'flex',
    alignItems: 'center',
    color: '#374151',
    fontSize: '14px',
  },
  icon: {
    width: '20px',
    height: '20px',
    marginRight: '8px',
    color: '#9ca3af',
  },
};

export default EventsPage;
