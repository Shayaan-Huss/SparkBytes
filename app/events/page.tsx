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
  const [includeFood, setIncludeFood] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [capacity, setCapacity] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
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
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 9;

  useEffect(() => {
    fetchEvents(1, searchQuery);

    const channel = supabase
      .channel("events-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "events" }, () => {
        fetchEvents(currentPage, searchQuery);
      })
      .subscribe();

    const foodChannel = supabase
      .channel("food-items-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "food_items" }, () => {
        fetchEvents(currentPage, searchQuery);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(foodChannel);
    };
  }, []);

  useEffect(() => {
    fetchEvents(1, searchQuery);
    setCurrentPage(1);
  }, [searchQuery]);

  const fetchEvents = async (page = 1, search = searchQuery) => {
    try {
      setLoading(true);
      let query = supabase.from("events").select("*").order("event_date", { ascending: true });
      const { data, error } = await query;
      if (error) throw error;

      let eventsWithFood = await Promise.all(
        (data || []).map(async (event) => {
          const { data: foodData } = await supabase
            .from("food_items")
            .select("*")
            .eq("event_id", event.id);
          return { ...event, food_items: foodData || [] };
        })
      );

      if (search.trim() !== "") {
        eventsWithFood = eventsWithFood.filter((event) => {
          const query = search.toLowerCase();
          const matchesEvent =
            event.title.toLowerCase().includes(query) ||
            event.description.toLowerCase().includes(query) ||
            event.location.toLowerCase().includes(query);
          const matchesFood = event.food_items.some(
            (f: { food_name: string; dietary_restrictions: string; }) =>
              f.food_name.toLowerCase().includes(query) ||
              f.dietary_restrictions.toLowerCase().includes(query)
          );
          return matchesEvent || matchesFood;
        });
      }

      const total = eventsWithFood.length;
      const from = (page - 1) * pageSize;
      const to = from + pageSize;
      setEvents(eventsWithFood.slice(from, to));
      setTotalPages(Math.ceil(total / pageSize));
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

      if (includeFood && eventId) {
        if (!foodName || !dietaryRestrictions || !quantity || !calorie) {
          setPopupType("error");
          setPopupMessage("Please complete all food fields.");
          return;
        }

        const foodError = await supabase.from("food_items").insert([
          {
            event_id: eventId,
            food_name: foodName,
            dietary_restrictions: dietaryRestrictions,
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
      setFoodName("");
      setDietaryRestrictions("");
      setQuantity("");
      setCalorie("");
      setIncludeFood(false);
      fetchEvents(1, searchQuery);
    } catch (err) {
      setPopupType("error");
      setPopupMessage(err instanceof Error ? err.message : "Failed to create event.");
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
      {/* Same UI, unchanged above */}

      <div className="max-w-6xl mx-auto mt-14">
        <h2 className="text-2xl font-semibold mb-6 text-center">Upcoming Events</h2>
        {loading ? (
          <p className="text-center text-gray-500">Loading events...</p>
        ) : error ? (
          <div className="bg-red-100 border border-red-300 p-6 rounded-lg text-center">
            <p className="text-red-700 mb-3">{error}</p>
            <button onClick={() => fetchEvents(currentPage, searchQuery)} className="bg-red-600 text-white px-4 py-2 rounded">Try Again</button>
          </div>
        ) : (
          <div className="space-y-8">
            {events.map((event: Event) => (
              <div key={event.id} className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-semibold mb-2">{event.title}</h3>
                    <p className="text-gray-600 mb-4">{event.description}</p>
                  </div>
                  <span className="bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full">{event.capacity} spots</span>
                </div>

                <div className="space-y-2 text-sm text-gray-700 mb-6 grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2"><span>📅</span> {formatDate(event.event_date)}</div>
                  <div className="flex items-center gap-2"><span>⏰</span> {formatTime(event.start_time)} – {formatTime(event.end_time)}</div>
                  <div className="flex items-center gap-2"><span>📍</span> {event.location}</div>
                </div>

                <div className="border-t pt-6">
                  <h4 className="text-lg font-semibold mb-4">Food Items</h4>
                  {event.food_items && event.food_items.length > 0 ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {event.food_items.map((food) => (
                        <div key={food.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                          <div className="flex justify-between items-start mb-2">
                            <h5 className="font-semibold">{food.food_name}</h5>
                            <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded">{food.quantity} available</span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{food.dietary_restrictions}</p>
                          <div className="text-sm text-gray-700 mb-2">🔥 {food.calorie} calories</div>
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
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={(page) => fetchEvents(page, searchQuery)} />
      </div>
    </div>
  );
}