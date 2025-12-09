import React from "react";
import { Event } from "../../types/event";

interface EventDetailProps {
  event: Event;
  isOpen: boolean;
  onClose: () => void;
}

export function EventDetail({ event, isOpen, onClose }: EventDetailProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50">
      <div className="bg-white/85 w-full max-w-lg rounded-2xl shadow-lg p-6 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
        {/* Title */}
        <h2 className="text-xl font-semibold mb-4 text-center">
          {event.title}
        </h2>
        {/* Event Info */}
        <div className="space-y-4 text-gray-700 mt-4">
          <div>
            {/* Description */}
            <p className="font-medium">Description:</p>
            <p>{event.description || "No description provided."}</p>
          </div>
          <div>
            {/* Location */}
            <p className="font-medium">Location:</p>
            <p>{event.location}</p>
          </div>
          <div>
            {/* Date */}
            <p className="font-medium">Date:</p>
            <p>{event.event_date}</p>
          </div>
          <div>
            {/* Time */}
            <p className="font-medium">Time:</p>
            <p>
              {event.start_time} - {event.end_time}
            </p>
          </div>
          <div>
            {/* Spot */}
            <p className="font-medium">Remaining Spot:</p>
            <p>{event.capacity} spots</p>
          </div>
        </div>
      </div>
    </div>
  );
}
