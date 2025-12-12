// app/events/page.tsx - UPDATED VERSION WITH FOOD CREATION
"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Pagination from '@/components/Pagination';
import { EventCard } from '@/components/EventCard';
import { shouldShowEvent } from '@/lib/eventUtils';

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
  const [includeFood, setIncludeFood] = useState(false);
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

    // Listen to food reservations changes to update availability in real-time
    const reservationsChannel = supabase
      .channel("food-reservations-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "food_reservations",
        },
        () => {
          fetchEvents(currentPage, searchQuery);
        }
      )
      .subscribe();

    // Listen to event registrations to update capacity
    const registrationsChannel = supabase
      .channel("event-registrations-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "event_registrations",
        },
        () => {
          fetchEvents(currentPage, searchQuery);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(foodChannel);
      supabase.removeChannel(reservationsChannel);
      supabase.removeChannel(registrationsChannel);
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

      // Fetch ALL events
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

      // ⭐ FILTER OUT EXPIRED AND FULLY BOOKED EVENTS ⭐
      const activeEvents = [];
      for (const event of eventsWithFood) {
        const isVisible = await shouldShowEvent(event);
        if (isVisible) {
          activeEvents.push(event);
        }
      }

      // Filter by search query (events + food items)
      let filteredEvents = activeEvents;
      if (search.trim() !== "") {
        filteredEvents = activeEvents.filter((event) => {
          const eventMatch =
            event.title.toLowerCase().includes(search.toLowerCase()) ||
            event.description.toLowerCase().includes(search.toLowerCase()) ||
            event.location.toLowerCase().includes(search.toLowerCase());

            const foodMatch = event.food_items.some(
              (food: FoodItem) =>
                food.food_name.toLowerCase().includes(search.toLowerCase()) ||
                food.dietary_restrictions.toLowerCase().includes(search.toLowerCase())
            );

          return eventMatch || foodMatch;
        });
      }

      // Now apply pagination to filtered results
      const totalFilteredCount = filteredEvents.length;
      const from = (page - 1) * pageSize;
      const to = from + pageSize;
      const paginatedEvents = filteredEvents.slice(from, to);

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
      setPopupMessage('Please fill in all event fields.');
      return;
    }

    // If food checkbox is checked, validate required food fields except dietary restrictions
    if (includeFood && (!foodName || !quantity || !calorie)) {
      setPopupType('error');
      setPopupMessage('Please complete all required food fields (food name, quantity, calories).');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setPopupType("error");
        setPopupMessage("You must be logged in to create an event.");
        return;
      }

      const { data, error } = await supabase.from("events").insert([
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
      ]).select();

      if (error) throw error;

      const eventId = data?.[0]?.id;

      // Add food item if checkbox is checked
      if (includeFood && eventId) {
        const foodError = await supabase.from("food_items").insert([
          {
            event_id: eventId,
            food_name: foodName,
            dietary_restrictions: dietaryRestrictions || "None",
            quantity: parseInt(quantity),
            calorie: parseInt(calorie),
          },
        ]);

        if (foodError.error) throw foodError.error;
      }

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

      // Reset food form states
      setIncludeFood(false);
      setFoodName('');
      setDietaryRestrictions('');
      setQuantity('');
      setCalorie('');

      fetchEvents(1, searchQuery);
    } catch (err) {
      setPopupType("error");
      setPopupMessage(
        err instanceof Error ? err.message : "Failed to create event."
      );
    }
  };

  return (
    <div className="min-h-screen px-6 py-10 text-black" style={{ fontFamily: 'Georgia, serif' }}>
      <div className="flex justify-between">
        <div>
          <h1 className="justify-left bold text-5xl">
            Find Free Food Events!
          </h1>
          <p className="mt-4 text-stone-500">Discover events with food accommodations across campus!</p>
          {/* badge showing filtered events */}
          <div className="mt-2 inline-block bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full">
            ✅ Showing only available events • Auto-hide expired/fully booked
          </div>
          <input 
            type="text" 
            placeholder="Search events!" 
            className="w-64 border-1 bg-white p-2 rounded-2xl my-4 block"
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
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50 overflow-y-auto">
          <div className="bg-white/85 w-full max-w-lg rounded-2xl shadow-lg p-6 relative max-h-[90vh] overflow-y-auto">
            
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

              {/* Food checkbox */}
              <label className="block text-sm font-medium mt-4">
                <input 
                  type="checkbox" 
                  checked={includeFood} 
                  onChange={(e) => setIncludeFood(e.target.checked)} 
                  className="mr-2" 
                />
                Include food
              </label>

              {/* Food fields - only shown when checkbox is checked */}
              {includeFood && (
                <div className="space-y-3 pt-2">
                  <input
                    type="text"
                    placeholder="Food name"
                    value={foodName}
                    onChange={(e) => setFoodName(e.target.value)}
                    className="w-full border border-gray-300 rounded-md p-2"
                  />
                  <input
                    type="text"
                    placeholder="Dietary restrictions (optional)"
                    value={dietaryRestrictions}
                    onChange={(e) => setDietaryRestrictions(e.target.value)}
                    className="w-full border border-gray-300 rounded-md p-2"
                  />
                  <input
                    type="number"
                    placeholder="Quantity"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full border border-gray-300 rounded-md p-2"
                  />
                  <input
                    type="number"
                    placeholder="Calories"
                    value={calorie}
                    onChange={(e) => setCalorie(e.target.value)}
                    className="w-full border border-gray-300 rounded-md p-2"
                  />
                </div>
              )}

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
          Available Events
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
          <div className="text-center">
            <p className="text-gray-500 mb-2">
              No active events found.
            </p>
            <p className="text-sm text-gray-400">
              All events are either expired or fully booked. Check back later for new events!
            </p>
          </div>
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
              <EventCard key={event.id} event={event} />
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