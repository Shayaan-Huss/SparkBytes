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

  // Temporary selections (Current UI State)
  const [tempReservedFood, setTempReservedFood] = useState<
    Record<number, boolean>
  >({});

  // Saved reservations from DB (Committed State)
  const [savedReservedFood, setSavedReservedFood] = useState<
    Record<number, boolean>
  >({});

  // UI-level remaining quantities per food item
  const [foodQuantities, setFoodQuantities] = useState<Record<number, number>>(
    {}
  );

  const foodList = useMemo(() => event.food_items ?? [], [event.food_items]);

  // Check if there are unsaved changes
  const hasChanges = useMemo(() => {
    if (!isRegistered) return false;

    const allIds = new Set([
      ...Object.keys(tempReservedFood).map(Number),
      ...Object.keys(savedReservedFood).map(Number),
    ]);

    for (const id of allIds) {
      const inTemp = !!tempReservedFood[id];
      const inSaved = !!savedReservedFood[id];
      if (inTemp !== inSaved) return true;
    }
    return false;
  }, [tempReservedFood, savedReservedFood, isRegistered]);

  const formatTime = (t: string) =>
    new Date(`2000-01-01T${t}`).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

  // Toggle food selection
  const toggleTempReserve = (foodId: number) => {
    const isCurrentlySelected = !!tempReservedFood[foodId];
    const isNowSelected = !isCurrentlySelected;

    const currentQty = foodQuantities[foodId] ?? 0;

    // Only block if we are SELECTING and there is NO qty left
    if (isNowSelected && currentQty <= 0) {
      showText("No more servings left for this item.", "error");
      return;
    }

    setTempReservedFood((prev) => ({
      ...prev,
      [foodId]: isNowSelected,
    }));

    setFoodQuantities((q) => {
      const current = q[foodId] ?? 0;
      return {
        ...q,
        [foodId]: current + (isNowSelected ? -1 : 1),
      };
    });
  };

  const handleClose = () => {
    setTempReservedFood({});
    onClose();
  };

  // Logic for initial Registration
  const handleRegister = async () => {
    if (!user) return;

    const { count: liveCount, error: liveCountError } = await supabase
      .from("event_registrations")
      .select("*", { count: "exact", head: true })
      .eq("event_id", event.id);

    if (liveCountError) {
      showText("Could not verify remaining spots.", "error");
      return;
    }

    const liveRemaining = event.capacity - (liveCount ?? 0);
    if (liveRemaining <= 0) {
      showText("No spots left.", "error");
      return;
    }

    // Check food availability
    const { data: allFoodRes, error: allFoodErr } = await supabase
      .from("food_reservations")
      .select("food_id")
      .eq("event_id", event.id);

    if (allFoodErr) {
      showText("Could not verify food availability.", "error");
      return;
    }

    const liveFoodQty: Record<number, number> = {};
    foodList.forEach((item) => {
      liveFoodQty[item.id] = item.quantity;
    });
    (allFoodRes || []).forEach((row: { food_id: number }) => {
      if (liveFoodQty[row.food_id] !== undefined) liveFoodQty[row.food_id] -= 1;
    });

    const selectedFoodIds = Object.keys(tempReservedFood)
      .filter((id) => tempReservedFood[Number(id)])
      .map((id) => Number(id));

    for (const fid of selectedFoodIds) {
      if (liveFoodQty[fid] <= 0) {
        showText(
          "Some food items are no longer available. Refresh and try again.",
          "error"
        );
        return;
      }
    }

    const { error: regErr } = await supabase
      .from("event_registrations")
      .insert({ user_id: user.id, event_id: event.id });

    if (regErr) {
      showText("Registration failed.", "error");
      return;
    }

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
        showText("Food reservation failed.", "error");
      }
    }

    setSavedReservedFood({ ...tempReservedFood });
    setTempReservedFood({ ...tempReservedFood });
    setIsRegistered(true);
    setRemainingSpots((prev) => (prev !== null ? prev - 1 : prev));

    showText("Registered successfully!", "success");
  };

  // Logic for Updating
  const handleUpdate = async () => {
    if (!user) return;

    const currentSelectedIds = Object.keys(tempReservedFood)
      .filter((id) => tempReservedFood[Number(id)])
      .map(Number);

    const savedIds = Object.keys(savedReservedFood)
      .filter((id) => savedReservedFood[Number(id)])
      .map(Number);

    const toAdd = currentSelectedIds.filter((id) => !savedReservedFood[id]);
    const toRemove = savedIds.filter((id) => !tempReservedFood[id]);

    if (toAdd.length === 0 && toRemove.length === 0) {
      showText("No changes detected.", "error");
      return;
    }

    // Verify inventory for ADDED items
    if (toAdd.length > 0) {
      const { data: allFoodRes, error: allFoodErr } = await supabase
        .from("food_reservations")
        .select("food_id")
        .eq("event_id", event.id);

      if (allFoodErr) {
        showText("Could not verify food availability.", "error");
        return;
      }

      const liveFoodQty: Record<number, number> = {};
      foodList.forEach((item) => {
        liveFoodQty[item.id] = item.quantity;
      });
      (allFoodRes || []).forEach((row: { food_id: number }) => {
        if (liveFoodQty[row.food_id] !== undefined)
          liveFoodQty[row.food_id] -= 1;
      });

      for (const fid of toAdd) {
        if (liveFoodQty[fid] <= 0) {
          showText("Some new items selected are no longer available.", "error");
          return;
        }
      }
    }

    // Remove
    if (toRemove.length > 0) {
      const { error: delErr } = await supabase
        .from("food_reservations")
        .delete()
        .eq("user_id", user.id)
        .eq("event_id", event.id)
        .in("food_id", toRemove);

      if (delErr) {
        showText("Failed to remove some items.", "error");
        return;
      }
    }

    // Add
    if (toAdd.length > 0) {
      const inserts = toAdd.map((fid) => ({
        user_id: user.id,
        food_id: fid,
        event_id: event.id,
      }));
      const { error: addErr } = await supabase
        .from("food_reservations")
        .insert(inserts);

      if (addErr) {
        showText("Failed to add some items.", "error");
        return;
      }
    }

    setSavedReservedFood({ ...tempReservedFood });
    showText("Reservation updated successfully!", "success");
  };

  const handleCancelRegistration = async () => {
    if (!user) return;

    const { error: regErr } = await supabase
      .from("event_registrations")
      .delete()
      .eq("user_id", user.id)
      .eq("event_id", event.id);

    if (regErr) {
      showText("Cancel registration failed.", "error");
      return;
    }

    const { error: foodErr } = await supabase
      .from("food_reservations")
      .delete()
      .eq("user_id", user.id)
      .eq("event_id", event.id);
    
    if(foodErr) console.error(foodErr);

    // Recompute food quantities
    const baseQuantities: Record<number, number> = {};
    foodList.forEach((item) => {
      baseQuantities[item.id] = item.quantity;
    });

    const { data: allFoodRes } = await supabase
      .from("food_reservations")
      .select("food_id")
      .eq("event_id", event.id);

    (allFoodRes || []).forEach((row: { food_id: number }) => {
      if (baseQuantities[row.food_id] !== undefined) {
        baseQuantities[row.food_id] -= 1;
      }
    });

    setFoodQuantities(baseQuantities);
    setIsRegistered(false);
    setSavedReservedFood({});
    setTempReservedFood({});
    setRemainingSpots((prev) => (prev !== null ? prev + 1 : prev));

    showText("Registration canceled.", "success");
  };

  useEffect(() => {
    if (!isOpen || !user) return;

    const loadData = async () => {
      // 1. Check registration
      const { data: regData } = await supabase
        .from("event_registrations")
        .select("*")
        .eq("event_id", event.id)
        .eq("user_id", user.id)
        .maybeSingle();

      const registered = !!regData;
      setIsRegistered(registered);

      // 2. Remaining spots
      const { count } = await supabase
        .from("event_registrations")
        .select("*", { count: "exact", head: true })
        .eq("event_id", event.id);

      setRemainingSpots(event.capacity - (count ?? 0));

      // 3. Base Quantities & 4. Subtract ALL reservations
      const baseQuantities: Record<number, number> = {};
      foodList.forEach((item) => {
        baseQuantities[item.id] = item.quantity;
      });

      const { data: allFoodRes } = await supabase
        .from("food_reservations")
        .select("food_id")
        .eq("event_id", event.id);

      (allFoodRes || []).forEach((row: { food_id: number }) => {
        if (baseQuantities[row.food_id] !== undefined) {
          baseQuantities[row.food_id] -= 1;
        }
      });

      // 5. Initialize State
      if (registered) {
        const { data: foodData } = await supabase
          .from("food_reservations")
          .select("food_id")
          .eq("event_id", event.id)
          .eq("user_id", user.id);

        const saved: Record<number, boolean> = {};
        (foodData || []).forEach((row: { food_id: number }) => {
          saved[row.food_id] = true;
        });
        setSavedReservedFood(saved);
        setTempReservedFood(saved);
      } else {
        setSavedReservedFood({});
        setTempReservedFood({});
      }

      setFoodQuantities(baseQuantities);
    };

    loadData();
  }, [isOpen, user, event.id, event.capacity, foodList]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-md z-50 p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={handleClose}
          className="sticky top-0 float-right text-gray-500 hover:text-gray-700 text-xl mt-3 mr-3 z-10 bg-white rounded-full w-8 h-8 flex items-center justify-center"
        >
          ✕
        </button>

        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4 text-center">{event.title}</h2>

          <div className="mb-4">
            <p className="text-sm text-gray-500 font-medium mb-1">
              📝 Description
            </p>
            <p className="text-gray-700">
              {event.description || "No description provided."}
            </p>
          </div>

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
              <p className="text-sm text-gray-500 font-medium">
                Total Capacity
              </p>
              <span className="inline-block bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full font-medium">
                {event.capacity} spots
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">
                Remaining Spots
              </p>
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

          <div className="border-t my-4"></div>

          <h3 className="text-lg font-semibold mb-3">Food Items</h3>

          {foodList.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {foodList.map((item) => {
                const isTemp = !!tempReservedFood[item.id];
                const remainingFood = foodQuantities[item.id] ?? item.quantity;

                return (
                  <div
                    key={item.id}
                    className={`border rounded-lg p-3 bg-gray-50 shadow-sm transition-all ${
                      isTemp
                        ? "border-blue-500 shadow-md"
                        : "border-gray-300"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{item.food_name}</p>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                          Total: {item.quantity}
                        </span>
                      </div>
                      <span
                        className={
                          "inline-block text-xs px-3 py-1 rounded-full font-medium ml-2 shrink-0 " +
                          getBadgeClass(remainingFood, item.quantity)
                        }
                      >
                        {remainingFood} left
                      </span>
                    </div>

                    <p className="text-sm text-gray-600">
                      {item.dietary_restrictions || "No dietary restrictions"}
                    </p>
                    <p className="text-sm text-gray-700 mt-1">
                      🔥 {item.calorie} cal
                    </p>

                    {!isCreator && (
                      <div className="flex justify-end mt-3">
                        <button
                          onClick={() => toggleTempReserve(item.id)}
                          className={`text-xs px-3 py-1 rounded transition-all border ${
                            isTemp
                              ? "bg-blue-100 text-blue-700 border-blue-400"
                              : "bg-green-100 text-green-700 border-green-400"
                          }`}
                        >
                          {isTemp ? "Reserved" : "Reserve"}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No food items added yet.</p>
          )}

          <div className="mt-6 pt-4 border-t">
            {isCreator ? (
              <p className="text-center text-blue-700 font-medium">
                You are the creator of this event.
              </p>
            ) : isRegistered ? (
              hasChanges ? (
                <button
                  className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                  onClick={handleUpdate}
                >
                  Update Reservation
                </button>
              ) : (
                <button
                  className="w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600"
                  onClick={handleCancelRegistration}
                >
                  Cancel Registration
                </button>
              )
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
      </div>
      <ShowText popup={popup} />
    </div>
  );
}