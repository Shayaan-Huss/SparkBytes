"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";

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

export default function EventsPage() {
  const [formVisible, setFormVisible] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [capacity, setCapacity] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState<"" | "success" | "error">("");

  useEffect(() => {
    fetchEvents();

    const channel = supabase
      .channel("events-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "events" },
        fetchEvents
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("event_date", { ascending: true });

      if (error) throw error;

      setEvents(data || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch events.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!title || !description || !capacity || !date || !startTime || !endTime || !location) {
      setPopupType("error");
      setPopupMessage("Please fill in all fields.");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setPopupType("error");
        setPopupMessage("You must be logged in to create an event.");
        return;
      }

      const { error } = await supabase.from("events").insert([
        {
          title,
          description,
          capacity: parseInt(capacity),
          event_date: date,
          start_time: startTime,
          end_time: endTime,
          location,
          creator_id: user.id,
        },
      ]);

      if (error) throw error;

      setPopupType("success");
      setPopupMessage("Event created successfully!");
      setFormVisible(false);

      setTitle("");
      setDescription("");
      setCapacity("");
      setDate("");
      setStartTime("");
      setEndTime("");
      setLocation("");

      fetchEvents();
    } catch (err) {
      setPopupType("error");
      setPopupMessage(
        err instanceof Error ? err.message : "Failed to create event."
      );
    }
  };

  const formatDate = (str: string) =>
    new Date(str).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const formatTime = (t: string) =>
    new Date(`2000-01-01T${t}`).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

  return (
    <div className="min-h-screen px-6 py-10 text-black" style={{ fontFamily: 'Georgia, serif' }}>
      <div className="flex justify-between">
        <div>
          <h1 className="justify-left bold text-5xl">
            Find Free Food Events!
          </h1>
          <p className="mt-4 text-stone-500">Discover events with food accommodations across campus!</p>
          <input type="text" placeholder="Search events!" className="w-64 border-1 bg-white p-2 rounded-2xl my-4"/>
        </div>
        <div className="mr-20 items-center">
          {/* Event Creation Button */}
          {!formVisible && (
            <div className="flex justify-center items-center mb-10">
              <button
                onClick={() => setFormVisible(true)}
                className="mx-auto mb-6 px-4 py-2 bg-white text-black rounded-xl shadow hover:bg-gray-100 transition"
              >
                + Create Event
              </button>
            </div>
          )}
        </div>
      </div>
      
      

      {/* Event Form */}
      {formVisible && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50">
          <div className="bg-white/85 w-full max-w-lg rounded-2xl shadow-lg p-6 relative">
            
            {/* Close button */}
            <button
              onClick={() => setFormVisible(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>

            <h2 className="text-xl font-semibold mb-4 text-center">Create an Event</h2>

            <form onSubmit={handleSubmit} className="space-y-3">

              <input
                type="text"
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2"
              />

              <textarea
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2 h-24"
              />

              <input
                type="number"
                placeholder="Capacity"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2"
              />

              <input
                type="date"
                value={date}
                placeholder="Date"
                onChange={(e) => setDate(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2"
              />

              <input
                type="time"
                placeholder="Start Time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2"
              />

              <input
                type="time"
                placeholder="End Time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2"
              />

              <input
                type="text"
                placeholder="Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2"
              />

              {/* Submit/Cancel Buttons */}
              <div className="flex justify-center pt-3">
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* Popup */}
      {popupMessage && (
        <div
          onClick={() => setPopupMessage("")}
          className={`mx-auto mt-6 w-fit px-6 py-3 rounded-lg border cursor-pointer ${
            popupType === "error"
              ? "bg-red-100 text-red-700 border-red-300"
              : "bg-green-100 text-green-700 border-green-300"
          }`}
        >
          {popupMessage}
        </div>
      )}

      {/* List of Events */}
      <div className="max-w-5xl mx-auto mt-14">
        <h2 className="text-2xl font-semibold mb-6 text-center">
          Upcoming Events
        </h2>

        {loading ? (
          <p className="text-center text-gray-500">Loading events...</p>
        ) : error ? (
          <div className="bg-red-100 border border-red-300 p-6 rounded-lg text-center">
            <p className="text-red-700 mb-3">{error}</p>
            <button
              onClick={fetchEvents}
              className="bg-red-600 text-white px-4 py-2 rounded"
            >
              Try Again
            </button>
          </div>
        ) : events.length === 0 ? (
          <p className="text-gray-500 text-center">
            No events found. Create one to get started!
          </p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <div
                key={event.id}
                className="bg-white p-5 rounded-xl shadow hover:shadow-lg transition"
              >
                <div className="flex justify-between mb-2">
                  <h3 className="text-lg font-semibold">{event.title}</h3>
                  <span className="bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full">
                    {event.capacity} spots
                  </span>
                </div>

                <p className="text-gray-600 mb-4">{event.description}</p>

                <div className="space-y-2 text-sm text-gray-700">
                  <div className="flex items-center gap-2">
                    <span>📅</span> {formatDate(event.event_date)}
                  </div>
                  <div className="flex items-center gap-2">
                    <span>⏰</span> {formatTime(event.start_time)} –{" "}
                    {formatTime(event.end_time)}
                  </div>
                  <div className="flex items-center gap-2">
                    <span>📍</span> {event.location}
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
