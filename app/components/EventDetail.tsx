"use client";
import React, { useEffect, useState, useMemo } from "react";
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

  // Temporary selections before registration
  const [tempReservedFood, setTempReservedFood] = useState<Record<number, boolean>>({});

  // Saved reservations from DB (after registration)
  const [savedReservedFood, setSavedReservedFood] = useState<Record<number, boolean>>({});

  // UI-level remaining quantities per food item
  const [foodQuantities, setFoodQuantities] = useState<Record<number, number>>({});

  const foodList = useMemo(() => event.food_items ?? [], [event.food_items]);

  const formatTime = (t: string) =>
    new Date(`2000-01-01T${t}`).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

  // Toggle temp food selection and update UI quantity
  const toggleTempReserve = (foodId: number) => {
    if (isRegistered) return;
    if (savedReservedFood[foodId]) return;

    // 1. Determine next selection state based on current state
    const isCurrentlySelected = !!tempReservedFood[foodId];
    const isNowSelected = !isCurrentlySelected;

    // 2. Check availability based on current UI state
    const currentQty = foodQuantities[foodId] ?? 0;

    // Prevent selection if no quantity left
    if (isNowSelected && currentQty <= 0) {
      showText("No more servings left for this item.", "error");
      return;
    }

    // 3. Update selection state
    setTempReservedFood((prev) => ({
      ...prev,
      [foodId]: isNowSelected,
    }));

    // 4. Update quantity state independently to avoid double-execution issues in Strict Mode
    setFoodQuantities((q) => {
      const current = q[foodId] ?? 0;
      return {
        ...q,
        [foodId]: current + (isNowSelected ? -1 : 1),
      };
    });
  };

  const handleClose = () => {
    // Clear temp selection; quantities will be recalculated next time modal opens
    setTempReservedFood({});
    onClose();
  };

  const handleRegister = async () => {
    if (!user) return;

    // 1. Re-check event capacity in real-time
    const { count: liveCount, error: liveCountError } = await supabase
      .from("event_registrations")
      .select("*", { count: "exact", head: true })
      .eq("event_id", event.id);

    if (liveCountError) {
      console.error("Fetch live registration count failed:", liveCountError);
      showText("Could not verify remaining spots.", "error");
      return;
    }

    const liveRemaining = event.capacity - (liveCount ?? 0);

    if (liveRemaining <= 0) {
      showText("No spots left. Someone registered before you.", "error");
      return;
    }

    // 2. Re-check food availability in real-time
    const { data: allFoodRes, error: allFoodErr } = await supabase
      .from("food_reservations")
      .select("food_id")
      .eq("event_id", event.id);

    if (allFoodErr) {
      console.error("Fetch food reservations failed:", allFoodErr);
      showText("Could not verify food availability.", "error");
      return;
    }

    // Calculate live quantities based on DB data
    const liveFoodQty: Record<number, number> = {};
    foodList.forEach((item) => {
      liveFoodQty[item.id] = item.quantity;
    });

    (allFoodRes || []).forEach((row: { food_id: number }) => {
      if (liveFoodQty[row.food_id] !== undefined) {
        liveFoodQty[row.food_id] -= 1;
      }
    });

    const selectedFoodIds = Object.keys(tempReservedFood)
      .filter((id) => tempReservedFood[Number(id)])
      .map((id) => Number(id));

    // Verify if selected items are still available
    for (const fid of selectedFoodIds) {
      if (liveFoodQty[fid] <= 0) {
        showText(
          "Some food items are no longer available. Please refresh and try again.",
          "error"
        );
        return;
      }
    }

    // 3. Insert event registration
    const { error: regErr } = await supabase
      .from("event_registrations")
      .insert({ user_id: user.id, event_id: event.id });

    if (regErr) {
      console.error("Registration failed:", regErr);
      showText("Registration failed.", "error");
      return;
    }

    // 4. Insert food reservations (only for selected items)
    if (selectedFoodIds.length > 0) {
      const inserts = selectedFoodIds.map((fid) => ({
        user_id: user.id,
        food_id: fid,
        event_id: event.id,
      }));

      const { error: foodErr } = await supabase
        .from("food_reservations")
        .insert(inserts);

      if (foodErr) {
        console.error("Food reservation failed:", foodErr);
        showText("Food reservation failed.", "error");
      }
    }

    // 5. Update UI state
    setSavedReservedFood({ ...tempReservedFood });
    setTempReservedFood({});
    setIsRegistered(true);
    setRemainingSpots((prev) => (prev !== null ? prev - 1 : prev));

    showText("Registered successfully!", "success");
  };

  // Cancel registration and remove food reservations for this user
  const handleCancelRegistration = async () => {
    if (!user) return;

    const { error: regErr } = await supabase
      .from("event_registrations")
      .delete()
      .eq("user_id", user.id)
      .eq("event_id", event.id);

    if (regErr) {
      console.error("Cancel registration failed:", regErr);
      showText("Cancel registration failed.", "error");
      return;
    }

    const { error: foodErr } = await supabase
      .from("food_reservations")
      .delete()
      .eq("user_id", user.id)
      .eq("event_id", event.id);

    if (foodErr) {
      console.error("Cancel food reservations failed:", foodErr);
    }

    // Recompute food quantities from DB (exclude current user)
    const baseQuantities: Record<number, number> = {};
    foodList.forEach((item) => {
      baseQuantities[item.id] = item.quantity;
    });

    const { data: allFoodRes, error: allFoodErr } = await supabase
      .from("food_reservations")
      .select("food_id")
      .eq("event_id", event.id);

    if (allFoodErr) {
      console.error("Fetch food reservations after cancel failed:", allFoodErr);
    } else {
      (allFoodRes || []).forEach((row: { food_id: number }) => {
        if (baseQuantities[row.food_id] !== undefined) {
          baseQuantities[row.food_id] -= 1;
        }
      });
    }

    setFoodQuantities(baseQuantities);
    setIsRegistered(false);
    setSavedReservedFood({});
    setTempReservedFood({});
    setRemainingSpots((prev) => (prev !== null ? prev + 1 : prev));

    showText("Registration and food reservations canceled.", "success");
  };

  useEffect(() => {
    if (!isOpen || !user) return;

    const loadData = async () => {
      setTempReservedFood({});

      // 1. Check if user is registered
      const { data: regData, error: regError } = await supabase
        .from("event_registrations")
        .select("*")
        .eq("event_id", event.id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (regError) {
        console.error("Fetch registration failed:", regError);
      }

      const registered = !!regData;
      setIsRegistered(registered);

      // 2. Remaining spots
      const { count, error: countError } = await supabase
        .from("event_registrations")
        .select("*", { count: "exact", head: true })
        .eq("event_id", event.id);

      if (countError) {
        console.error("Fetch registration count failed:", countError);
      }

      const safeCount = count ?? 0;
      setRemainingSpots(event.capacity - safeCount);

      // 3. Compute base quantities from event
      const baseQuantities: Record<number, number> = {};
      foodList.forEach((item) => {
        baseQuantities[item.id] = item.quantity;
      });

      // 4. Subtract all reservations (all users) from DB
      const { data: allFoodRes, error: allFoodErr } = await supabase
        .from("food_reservations")
        .select("food_id")
        .eq("event_id", event.id);

      if (allFoodErr) {
        console.error("Fetch food reservations failed:", allFoodErr);
      } else {
        (allFoodRes || []).forEach((row: { food_id: number }) => {
          if (baseQuantities[row.food_id] !== undefined) {
            baseQuantities[row.food_id] -= 1;
          }
        });
      }

      // 5. If registered, fetch this user's saved reservations for UI highlight
      if (registered) {
        const { data: foodData, error: foodError } = await supabase
          .from("food_reservations")
          .select("food_id")
          .eq("event_id", event.id)
          .eq("user_id", user.id);

        if (foodError) {
          console.error("Fetch user food reservations failed:", foodError);
        } else {
          const saved: Record<number, boolean> = {};
          (foodData || []).forEach((row: { food_id: number }) => {
            saved[row.food_id] = true;
          });
          setSavedReservedFood(saved);
        }
      } else {
        setSavedReservedFood({});
      }

      setFoodQuantities(baseQuantities);
    };

    loadData();
  }, [isOpen, user, event.id, event.capacity, foodList]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-md z-50">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl p-6 relative">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>

        {/* Title */}
        <h2 className="text-2xl font-bold mb-4 text-center">{event.title}</h2>

        {/* Description */}
        <div className="mb-4">
          <p className="text-sm text-gray-500 font-medium mb-1">📝 Description</p>
          <p className="text-gray-700">
            {event.description || "No description provided."}
          </p>
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

        {foodList.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {foodList.map((item) => {
              const isSaved = !!savedReservedFood[item.id];
              const isTemp = !!tempReservedFood[item.id];
              const isReserved = isSaved || isTemp;
              const remaining = foodQuantities[item.id] ?? item.quantity;

              return (
                <div
                  key={item.id}
                  className={`border rounded-lg p-3 bg-gray-50 shadow-sm transition-all ${
                    isReserved ? "border-blue-500 shadow-md" : "border-gray-300"
                  }`}
                >
                  {/* Item Header */}
                  <div className="flex justify-between items-center">
                    <p className="font-semibold">{item.food_name}</p>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                      {remaining} left
                    </span>
                  </div>

                  {/* Dietary Info */}
                  <p className="text-sm text-gray-600">
                    {item.dietary_restrictions || "No dietary restrictions"}
                  </p>
                  <p className="text-sm text-gray-700 mt-1">
                    🔥 {item.calorie} cal
                  </p>

                  {/* Reserve Button */}
                  <div className="flex justify-end mt-3">
                    <button
                      onClick={() => toggleTempReserve(item.id)}
                      disabled={!!isRegistered}
                      className={`text-xs px-3 py-1 rounded transition-all border ${
                        isReserved
                          ? "bg-blue-100 text-blue-700 border-blue-400"
                          : "bg-green-100 text-green-700 border-green-400"
                      } ${isRegistered ? "opacity-70 cursor-not-allowed" : ""}`}
                    >
                      {isSaved
                        ? "✓ Reserved"
                        : isReserved
                        ? "Reserved"
                        : "Reserve"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No food items added yet.</p>
        )}

        {/* Registration Actions */}
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
              className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
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