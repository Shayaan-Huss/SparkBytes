// app/events/page.tsx - WITH MULTIPLE FOOD ITEMS FEATURE
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

// Temporary food item type for form
interface TempFoodItem {
  food_name: string;
  dietary_restrictions: string;
  quantity: string;
  calorie: string;
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

  // Food form states - MULTIPLE ITEMS
  const [includeFood, setIncludeFood] = useState(false);
  const [foodItems, setFoodItems] = useState<TempFoodItem[]>([]);
  const [currentFoodName, setCurrentFoodName] = useState('');
  const [currentDietaryRestrictions, setCurrentDietaryRestrictions] = useState('');
  const [currentQuantity, setCurrentQuantity] = useState('');
  const [currentCalorie, setCurrentCalorie] = useState('');

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [popupMessage, setPopupMessage] = useState('');
  const [popupType, setPopupType] = useState<'success' | 'error' | ''>('');
  const [formError, setFormError] = useState('');
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

  // ⭐ NEW: Add food item to list
  const handleAddFoodItem = () => {
    if (!currentFoodName || !currentQuantity) {
      setFormError('Food name and quantity are required!');
      return;
    }

    const newFoodItem: TempFoodItem = {
      food_name: currentFoodName,
      dietary_restrictions: currentDietaryRestrictions || 'None',
      quantity: currentQuantity,
      calorie: currentCalorie || '0',
    };

    setFoodItems([...foodItems, newFoodItem]);

    // Clear current food fields
    setCurrentFoodName('');
    setCurrentDietaryRestrictions('');
    setCurrentQuantity('');
    setCurrentCalorie('');
    setFormError('');
  };

  // ⭐ NEW: Remove food item from list
  const handleRemoveFoodItem = (index: number) => {
    setFoodItems(foodItems.filter((_, i) => i !== index));
  };

  const handleEventSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(''); // Clear previous errors
  
    if (!title || !description || !capacity || !date || !startTime || !endTime || !location) {
      setFormError('Please fill in all event fields.');
      return;
    }
  
    // ⭐ Validate event is not in the past
    const eventStartDateTime = new Date(`${date}T${startTime}`);
    const now = new Date();
    
    if (eventStartDateTime < now) {
      setFormError('❌ Cannot create events with past start times!');
      return;
    }
    
    // ⭐ Validate end time is after start time
    const eventEndDateTime = new Date(`${date}T${endTime}`);
    if (eventEndDateTime <= eventStartDateTime) {
      setFormError('❌ End time must be after start time!');
      return;
    }
  
    // ⭐ NEW: Check if user wants food but hasn't added any
    if (includeFood && foodItems.length === 0) {
      setFormError('Please add at least one food item or uncheck "Include food".');
      return;
    }
  
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setFormError("You must be logged in to create an event.");
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
  
      // ⭐ NEW: Add ALL food items
      if (includeFood && eventId && foodItems.length > 0) {
        const foodItemsToInsert = foodItems.map(item => ({
          event_id: eventId,
          food_name: item.food_name,
          dietary_restrictions: item.dietary_restrictions,
          quantity: parseInt(item.quantity),
          calorie: parseInt(item.calorie),
        }));

        const { error: foodError } = await supabase
          .from("food_items")
          .insert(foodItemsToInsert);

        if (foodError) throw foodError;
      }
  
      setPopupType("success");
      setPopupMessage(`Event created successfully with ${foodItems.length} food item(s)!`);
      setFormVisible(false);
      setFormError('');
  
      setTitle("");
      setDescription("");
      setCapacity("");
      setDate("");
      setStartTime("");
      setEndTime("");
      setLocation("");
  
      // ⭐ NEW: Reset food form states
      setIncludeFood(false);
      setFoodItems([]);
      setCurrentFoodName('');
      setCurrentDietaryRestrictions('');
      setCurrentQuantity('');
      setCurrentCalorie('');
  
      fetchEvents(1, searchQuery);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create event.");
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
              onClick={() => {
                setFormVisible(false);
                setFormError('');
                setFoodItems([]);
              }}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>

            <h2 className="text-xl font-semibold mb-4 text-center">Create an Event</h2>

            {/* Form Error Message */}
            {formError && (
              <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
                {formError}
              </div>
            )}

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

              {/* ⭐ NEW: Multiple Food Items Section */}
              {includeFood && (
                <div className="space-y-3 pt-2 border-t border-gray-200 mt-3">
                  <h3 className="text-sm font-semibold text-gray-700">Add Food Items</h3>
                  
                  {/* Current food item being added */}
                  <div className="space-y-2 bg-gray-50 p-3 rounded-md">
                    <input
                      type="text"
                      placeholder="Food name *"
                      value={currentFoodName}
                      onChange={(e) => setCurrentFoodName(e.target.value)}
                      className="w-full border border-gray-300 rounded-md p-2"
                    />
                    <input
                      type="text"
                      placeholder="Dietary restrictions (optional)"
                      value={currentDietaryRestrictions}
                      onChange={(e) => setCurrentDietaryRestrictions(e.target.value)}
                      className="w-full border border-gray-300 rounded-md p-2"
                    />
                    <input
                      type="number"
                      placeholder="Quantity *"
                      value={currentQuantity}
                      onChange={(e) => setCurrentQuantity(e.target.value)}
                      className="w-full border border-gray-300 rounded-md p-2"
                    />
                    <input
                      type="number"
                      placeholder="Calories (optional)"
                      value={currentCalorie}
                      onChange={(e) => setCurrentCalorie(e.target.value)}
                      className="w-full border border-gray-300 rounded-md p-2"
                    />
                    
                    <button
                      type="button"
                      onClick={handleAddFoodItem}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      + Add Food Item
                    </button>
                  </div>

                  {/* List of added food items */}
                  {foodItems.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-gray-700">Added Food Items ({foodItems.length}):</h4>
                      {foodItems.map((item, index) => (
                        <div key={index} className="flex justify-between items-center bg-white p-2 rounded-md border border-gray-200">
                          <div className="flex-1">
                            <p className="font-medium">{item.food_name}</p>
                            <p className="text-xs text-gray-500">
                              {item.dietary_restrictions} • Qty: {item.quantity} • {item.calorie} cal
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveFoodItem(index)}
                            className="ml-2 px-2 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
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