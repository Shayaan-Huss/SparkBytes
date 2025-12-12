// app/lib/eventUtils.ts
import { Event, FoodItem } from '../../types/event';
import { supabase } from '../../lib/supabaseClient';

/**
 * Check if event time has passed (uses START_TIME now!)
 */
export function isEventExpired(eventDate: string, startTime: string): boolean {
  const eventStartDateTime = new Date(`${eventDate}T${startTime}`);
  const now = new Date();
  return eventStartDateTime < now;
}

/**
 * Check if all food items are fully reserved
 */
export function areAllFoodItemsReserved(foodItems: FoodItem[]): boolean {
  if (!foodItems || foodItems.length === 0) return false;
  
  // Event is fully booked if ALL food items have quantity 0
  return foodItems.every(item => item.quantity <= 0);
}

/**
 * Check if event capacity is reached
 * (Need to pass registration count from DB)
 */
export function isCapacityReached(capacity: number, registrationCount: number): boolean {
  return registrationCount >= capacity;
}

/**
 * Main function: Check if event should be visible
 * Event is hidden if: START TIME has passed OR all food is reserved OR capacity reached
 */
export async function shouldShowEvent(event: Event): Promise<boolean> {
  // Check 1: Has event started? (using START_TIME)
  const timeValid = !isEventExpired(event.event_date, event.start_time);
  if (!timeValid) return false;
  
  // Check 2: Are all food items reserved?
  if (event.food_items && event.food_items.length > 0) {
    // Fetch real-time food reservations to get accurate remaining quantities
    const remainingQuantities = await getRemainingFoodQuantities(event.id, event.food_items);
    const allFoodReserved = remainingQuantities.every(qty => qty <= 0);
    if (allFoodReserved) return false;
  }
  
  // Check 3: Is capacity reached?
  const { count } = await supabase
    .from('event_registrations')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', event.id);
  
  const registrationCount = count ?? 0;
  if (isCapacityReached(event.capacity, registrationCount)) return false;
  
  return true;
}

/**
 * Get remaining quantities for all food items (real-time from DB)
 */
export async function getRemainingFoodQuantities(
  eventId: string, 
  foodItems: FoodItem[]
): Promise<number[]> {
  // Fetch all food reservations for this event
  const { data: reservations, error } = await supabase
    .from('food_reservations')
    .select('food_id')
    .eq('event_id', eventId);
  
  if (error) {
    console.error('Error fetching food reservations:', error);
    return foodItems.map(item => item.quantity);
  }
  
  // Count reservations per food item
  const reservationCounts: Record<number, number> = {};
  (reservations || []).forEach((res: { food_id: number }) => {
    reservationCounts[res.food_id] = (reservationCounts[res.food_id] || 0) + 1;
  });
  
  // Calculate remaining quantities
  return foodItems.map(item => {
    const reserved = reservationCounts[item.id] || 0;
    return Math.max(0, item.quantity - reserved);
  });
}

/**
 * Get total remaining food for an event
 */
export async function getTotalRemainingFood(event: Event): Promise<number> {
  if (!event.food_items || event.food_items.length === 0) return 0;
  
  const remainingQuantities = await getRemainingFoodQuantities(event.id, event.food_items);
  return remainingQuantities.reduce((sum, qty) => sum + qty, 0);
}

/**
 * Get food availability status for notifications
 */
export async function getFoodAvailabilityStatus(event: Event): Promise<{
  available: boolean;
  totalRemaining: number;
  totalCapacity: number;
  percentage: number;
  urgency: 'high' | 'medium' | 'low';
}> {
  const totalCapacity = event.food_items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const totalRemaining = await getTotalRemainingFood(event);
  const percentage = totalCapacity > 0 ? (totalRemaining / totalCapacity) * 100 : 0;
  
  let urgency: 'high' | 'medium' | 'low';
  if (percentage <= 10) urgency = 'high';
  else if (percentage <= 30) urgency = 'medium';
  else urgency = 'low';
  
  return {
    available: totalRemaining > 0,
    totalRemaining,
    totalCapacity,
    percentage,
    urgency
  };
}

/**
 * Get remaining spots for an event
 */
export async function getRemainingSpots(eventId: string, capacity: number): Promise<number> {
  const { count } = await supabase
    .from('event_registrations')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId);
  
  const registrationCount = count ?? 0;
  return Math.max(0, capacity - registrationCount);
}