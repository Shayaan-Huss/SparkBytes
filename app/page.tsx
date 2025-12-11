"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import { EventCard } from "@/components/EventCard";

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

export default function Home() {
  const { user, load_user } = useAuth();
  const router = useRouter();

  const [myEvents, setMyEvents] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  useEffect(() => {
    if (!load_user && !user) {
      router.replace("/signin");
    }
  }, [load_user, user, router]);

  // Fetcbes events and then food related to the events
  useEffect(() => {
    const fetchMyEvents = async () => {
      if (!user) return;

      // Gets your registered events
      const { data: regData, error: regError } = await supabase
        .from("event_registrations")
        .select("event_id")
        .eq("user_id", user.id);

      if (regError) {
        console.error("Registration fetch error:", regError);
        setLoadingEvents(false);
        return;
      }

      const eventIds = regData.map((r) => r.event_id);

      if (eventIds.length === 0) {
        setMyEvents([]);
        setLoadingEvents(false);
        return;
      }

      // fetches the food relating to the event
      const { data: eventsData, error: eventsError } = await supabase
        .from("events")
        .select(`
          *,
          food_items (
            id,
            event_id,
            food_name,
            dietary_restrictions,
            quantity,
            calorie
          )
        `)
        .in("id", eventIds);

      if (eventsError) {
        console.error("Event fetch error:", eventsError);
        setLoadingEvents(false);
        return;
      }

      setMyEvents(eventsData as Event[]);
      setLoadingEvents(false);
    };

    fetchMyEvents();
  }, [user]);

  if (load_user || !user) {
    return <p className="text-center mt-10">Loading...</p>;
  }

  return (
    <main className="flex min-h-screen items-center">
      <div
        className="min-h-screen px-6 py-10 text-black justify-left flex flex-col"
        style={{ fontFamily: "Georgia, serif" }}
      >
        <h1 className="bold text-5xl">Welcome to SparkBytes!</h1>
        <h2 className="mt-4 text-stone-500 text-2xl">
          Here are your registered events
        </h2>

        <div className="mt-8">
          {loadingEvents ? (
            <p>Loading your events...</p>
          ) : myEvents.length === 0 ? (
            <p className="text-gray-500">You are not registered for any events yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {myEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
