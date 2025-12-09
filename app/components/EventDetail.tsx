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
        <p className="text-gray-600 text-center">
          Placeholder content for event detail modal.
        </p>
      </div>
    </div>
  );
}
