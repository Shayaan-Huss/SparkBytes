"use client";
import React, { useState } from 'react';

function EventsPage() {
  const [formVisible, setFormVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [capacity, setCapacity] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');

  const [popupMessage, setPopupMessage] = useState('');
  const [popupType, setPopupType] = useState<'success' | 'error' | ''>('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!title || !description || !capacity || !date || !time || !location) {
      setPopupType('error');
      setPopupMessage('Please fill in all fields.');
      return;
    }

    const eventData = {
      title,
      description,
      capacity: parseInt(capacity),
      date,
      time,
      location,
    };

    console.log('Event Created:', eventData);

    setPopupType('success');
    setPopupMessage('Event created successfully!');

    setTitle('');
    setDescription('');
    setCapacity('');
    setDate('');
    setTime('');
    setLocation('');
  };

  const closePopup = () => {
    setPopupMessage('');
    setPopupType('');
  };

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
            value={time}
            style={styles.input}
            onChange={(e) => setTime(e.target.value)}
          />
          <input
            type="text"
            placeholder="Location"
            value={location}
            style={styles.input}
            onChange={(e) => setLocation(e.target.value)}
          />

          <div style={styles.formButtons}>
            <button type="submit" style={styles.submitButton}>Submit</button>
            <button type="button" style={styles.cancelButton} onClick={() => setFormVisible(false)}>Cancel</button>
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
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  pageContainer: {
    fontFamily: 'Segoe UI, sans-serif',
    padding: '30px',
    textAlign: 'center',
    backgroundColor: '#f9fafb',
    minHeight: '100vh',
  },
  pageTitle: {
    fontSize: '32px',
    marginBottom: '20px',
  },
  createButton: {
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
    margin: 'auto',
    padding: '25px',
    backgroundColor: '#fff',
    borderRadius: '10px',
    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.1)',
  },
  formTitle: {
    marginBottom: '20px',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    marginBottom: '12px',
    borderRadius: '5px',
    border: '1px solid #ccc',
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    marginBottom: '12px',
    height: '100px',
    borderRadius: '5px',
    border: '1px solid #ccc',
    resize: 'vertical',
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
    marginTop: '20px',
    display: 'inline-block',
    padding: '12px 20px',
    borderRadius: '6px',
    border: '1px solid',
    cursor: 'pointer',
    transition: 'opacity 0.3s ease',
  },
};

export default EventsPage;
