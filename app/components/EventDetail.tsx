"use client";
import React, { useEffect, useState } from "react";
import { Event } from "../../types/event";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../../lib/supabaseClient";
import { getBadgeClass } from "../../lib/badgeColor";
import { useShowText } from "../../lib/useShowText";
import { ShowText } from "./ShowText";


interface EventDetailProps {
  event: Event;
  isOpen: boolean;
  onClose: () => void;
}

export function EventDetail({ event, isOpen, onClose }: EventDetailProps) {
  const { user } = useAuth();
  const isCreator = user?.id === event.creator_id;
  const { popup, showText } = useShowText();
  const [isRegistered, setIsRegistered] = useState<boolean | null>(null);
  const [remainingSpots, setRemainingSpots] = useState<number | null>(null);

  // Format time same as EventCard
  const formatTime = (t: string) =>
    new Date(`2000-01-01T${t}`).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

  // Register
  const handleRegister = async () => {
    if (!user) return;

    // Prevent overbooking
    if (remainingSpots !== null && remainingSpots <= 0) {
      alert("No spots left for this event.");
      return;
    }

    const { error } = await supabase
      .from("event_registrations")
      .insert({
        user_id: user.id,
        event_id: event.id,
      });

    if (error) {
      console.error("Registration failed:", error);
      return;
    }

    setIsRegistered(true);
    setRemainingSpots((prev) => (prev !== null ? prev - 1 : prev));
    showText("Successfully registered!", "success");
  };

  // Cancel registration
  const handleCancelRegistration = async () => {
    if (!user) return;

    const { error } = await supabase
      .from("event_registrations")
      .delete()
      .eq("user_id", user.id)
      .eq("event_id", event.id);

    if (error) {
      console.error("Cancel failed:", error);
      showText("Registration failed.", "error");
      return;
    }

    setIsRegistered(false);
    setRemainingSpots((prev) => (prev !== null ? prev + 1 : prev));
    showText("Registration canceled.", "success");
  };

  // Fetch registration and remaining spots
  useEffect(() => {
    if (!isOpen || !user) return;

    const loadData = async () => {
      // 1. Check if user is registered
      const { data: regData } = await supabase
        .from("event_registrations")
        .select("*")
        .eq("event_id", event.id)
        .eq("user_id", user.id)
        .maybeSingle();

      setIsRegistered(!!regData);

      // 2. Remaining spots
      const { count } = await supabase
        .from("event_registrations")
        .select("*", { count: "exact", head: true })
        .eq("event_id", event.id);

      const safeCount = count ?? 0;
      setRemainingSpots(event.capacity - safeCount);
    };
    loadData();
  }, [isOpen, user, event.id, event.capacity]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-md z-50">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl p-6 relative">

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>

        {/* Title */}
        <h2 className="text-2xl font-bold mb-4 text-center">{event.title}</h2>

        {/* Description */}
        <div className="mb-4">
          <p className="text-sm text-gray-500 font-medium mb-1">📝 Description</p>
          <p className="text-gray-700">{event.description || "No description provided."}</p>
        </div>

        {/* Event Info */}
        <div className="grid grid-cols-2 gap-4 text-gray-700 mb-4">

          <div>
            <p className="text-sm text-gray-500 font-medium">Date</p>
            <p className="font-medium">📅 {event.event_date}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500 font-medium">Time</p>
            <p className="font-medium">
              ⏰ {formatTime(event.start_time)} – {formatTime(event.end_time)}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 font-medium">Location</p>
            <p className="font-medium">📍 {event.location}</p>
          </div>
        
          {/* Total Capacity */}
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Capacity</p>
            <span className="inline-block bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full font-medium">
              {event.capacity} spots
            </span>
          </div>

          <div>
            <p className="text-sm text-gray-500 font-medium">Remaining Spots</p>
            <span
              className={
                "inline-block text-xs px-3 py-1 rounded-full font-medium " +
                getBadgeClass(remainingSpots, event.capacity)
              }
            >
              {remainingSpots ?? "..."} left
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t my-4"></div>

        {/* Food Items */}
        <h3 className="text-lg font-semibold mb-3">Food Items</h3>

        {event.food_items && event.food_items.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {event.food_items.map((item) => (
              <div key={item.id} className="border rounded-lg p-3 bg-gray-50 shadow-sm">
                <div className="flex justify-between items-center">
                  <p className="font-semibold">{item.food_name}</p>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                    {item.quantity} left
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  {item.dietary_restrictions || "No dietary restrictions"}
                </p>
                <p className="text-sm text-gray-700 mt-1">🔥 {item.calorie} cal</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No food items added yet.</p>
        )}

        {/* Registration Buttons */}
        <div className="mt-6 pt-4 border-t">
          {isCreator ? (
            <p className="text-center text-blue-700 font-medium">
              You are the creator of this event.
            </p>
          ) : isRegistered ? (
            <button
              className="w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600"
              onClick={handleCancelRegistration}
            >
              Cancel Registration
            </button>
          ) : (
            <button
              className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
              onClick={handleRegister}
              disabled={remainingSpots !== null && remainingSpots <= 0}
            >
              Register
            </button>
          )}
        </div>
      </div>
      <ShowText popup={popup} />
    </div>
  );
}