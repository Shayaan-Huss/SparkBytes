"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Pagination from '@/components/Pagination';

interface FoodItem {
  id: number;
  event_id: string;
  food_name: string;
  dietary_restrictions: string;
  quantity: number;
  calorie: number;
}

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
  food_items?: FoodItem[];
}

export default function EventsPage() {
  const [formVisible, setFormVisible] = useState(false);
  const [foodFormVisible, setFoodFormVisible] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // Event form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [capacity, setCapacity] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');

  // Food form states
  const [foodName, setFoodName] = useState('');
  const [dietaryRestrictions, setDietaryRestrictions] = useState('');
  const [quantity, setQuantity] = useState('');
  const [calorie, setCalorie] = useState('');

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [popupMessage, setPopupMessage] = useState('');
  const [popupType, setPopupType] = useState<'success' | 'error' | ''>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 9;

  useEffect(() => {
    fetchEvents(1, searchQuery);

    const channel = supabase
      .channel("events-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "events",
        },
        () => {
          fetchEvents(currentPage, searchQuery);
        }
      )
      .subscribe();

    const foodChannel = supabase
      .channel("food-items-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "food_items",
        },
        () => {
          fetchEvents(currentPage, searchQuery);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(foodChannel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchEvents(1, searchQuery);
    setCurrentPage(1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const fetchEvents = async (page = 1, search = searchQuery) => {
    try {
      setLoading(true);

      // First, fetch ALL events (without pagination) to search through food items
      let query = supabase
        .from("events")
        .select("*")
        .order("event_date", { ascending: true });

      const { data, error } = await query;

      if (error) throw error;

      // Fetch food items for each event
      let eventsWithFood = await Promise.all(
        (data || []).map(async (event) => {
          const { data: foodData, error: foodError } = await supabase
            .from("food_items")
            .select("*")
            .eq("event_id", event.id);

          if (foodError) console.error("Error fetching food items:", foodError);

          return {
            ...event,
            food_items: foodData || [],
          };
        })
      );

      // Filter by search query (events + food items)
      if (search.trim() !== "") {
        eventsWithFood = eventsWithFood.filter((event) => {
          const eventMatch =
            event.title.toLowerCase().includes(search.toLowerCase()) ||
            event.description.toLowerCase().includes(search.toLowerCase()) ||
            event.location.toLowerCase().includes(search.toLowerCase());

          const foodMatch = event.food_items.some(
            (food) =>
              food.food_name.toLowerCase().includes(search.toLowerCase()) ||
              food.dietary_restrictions.toLowerCase().includes(search.toLowerCase())
          );

          return eventMatch || foodMatch;
        });
      }

      // Now apply pagination to filtered results
      const totalFilteredCount = eventsWithFood.length;
      const from = (page - 1) * pageSize;
      const to = from + pageSize;
      const paginatedEvents = eventsWithFood.slice(from, to);

      setEvents(paginatedEvents);
      setTotalPages(Math.ceil(totalFilteredCount / pageSize));
      setCurrentPage(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch events.");
    } finally {
      setLoading(false);
    }
  };

  const handleEventSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!title || !description || !capacity || !date || !startTime || !endTime || !location) {
      setPopupType('error');
      setPopupMessage('Please fill in all fields.');
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
          location,
          event_date: date,
          start_time: startTime,
          end_time: endTime,
          capacity: parseInt(capacity),
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

      fetchEvents(1, searchQuery);
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
          <input 
            type="text" 
            placeholder="Search events!" 
            className="w-64 border-1 bg-white p-2 rounded-2xl my-4"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="mr-20 items-center">
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
            
            <button
              onClick={() => setFormVisible(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>

            <h2 className="text-xl font-semibold mb-4 text-center">Create an Event</h2>

            <form onSubmit={handleEventSubmit} className="space-y-3">

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
      <div className="max-w-6xl mx-auto mt-14">
        <h2 className="text-2xl font-semibold mb-6 text-center">
          Upcoming Events
        </h2>

        {loading ? (
          <p className="text-center text-gray-500">Loading events...</p>
        ) : error ? (
          <div className="bg-red-100 border border-red-300 p-6 rounded-lg text-center">
            <p className="text-red-700 mb-3">{error}</p>
            <button
              onClick={() => fetchEvents(currentPage, searchQuery)}
              className="bg-red-600 text-white px-4 py-2 rounded"
            >
              Try Again
            </button>
          </div>
        ) : totalPages === 0 && searchQuery === "" ? (
          <p className="text-gray-500 text-center">
            No events found. Create one to get started!
          </p>
        ) : totalPages === 0 && searchQuery !== "" ? (
          <p className="text-gray-500 text-center">
            No events match your search. Try a different query!
          </p>
        ) : events.length === 0 ? ( 
            <p className="text-gray-500 text-center">
              No events match your search.
            </p> 
        ) : (
          <div className="space-y-8">
            {events.map((event: Event) => (
              <div
                key={event.id}
                className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition"
              >
                {/* Event Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-semibold mb-2">{event.title}</h3>
                    <p className="text-gray-600 mb-4">{event.description}</p>
                  </div>
                  <span className="bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full">
                    {event.capacity} spots
                  </span>
                </div>

                <div className="space-y-2 text-sm text-gray-700 mb-6 grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <span>📅</span> {formatDate(event.event_date)}
                  </div>
                  <div className="flex items-center gap-2">
                    <span>⏰</span> {formatTime(event.start_time)} – {formatTime(event.end_time)}
                  </div>
                  <div className="flex items-center gap-2">
                    <span>📍</span> {event.location}
                  </div>
                </div>

                {/* Food Items Section */}
                <div className="border-t pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-semibold">Food Items</h4>
                    
                  </div>

                  {event.food_items && event.food_items.length > 0 ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {event.food_items.map((food: FoodItem) => (
                        <div
                          key={food.id}
                          className="bg-gray-50 p-4 rounded-lg border border-gray-200"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h5 className="font-semibold">{food.food_name}</h5>
                            <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded">
                              {food.quantity} available
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{food.dietary_restrictions}</p>
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <span>🔥</span> {food.calorie} calories
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No food items added yet.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => fetchEvents(page, searchQuery)}
        />
      </div>
    </div>
  );
}
