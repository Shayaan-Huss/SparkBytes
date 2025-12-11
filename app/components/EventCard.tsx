// app/components/EventCard.tsx
"use client";
import React, { useState } from 'react';
import { Event, FoodItem } from '../../types/event';
import { EventDetail } from './EventDetail';
import FoodAvailabilityNotification from './FoodAvailabilityNotification';

interface EventCardProps {
  event: Event;
}

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

export const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  return (
    <>
      <div
        className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition cursor-pointer" 
        onClick={() => setIsDetailOpen(true)}
      >
        {/* Food Availability Notification - Added at the top */}
        <FoodAvailabilityNotification event={event} />

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
                    <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">
                      Total: {food.quantity}
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
      {/* Event Detail Pop up */}
      <EventDetail
        event={event}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
      />
    </>
  );
};