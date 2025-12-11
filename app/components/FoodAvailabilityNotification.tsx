// app/components/FoodAvailabilityNotification.tsx
"use client";

import { useEffect, useState } from 'react';
import { Event } from '../../types/event';
import { getFoodAvailabilityStatus } from '@/lib/eventUtils';

interface FoodAvailabilityNotificationProps {
  event: Event;
}

export default function FoodAvailabilityNotification({ event }: FoodAvailabilityNotificationProps) {
  const [status, setStatus] = useState<{
    available: boolean;
    totalRemaining: number;
    totalCapacity: number;
    percentage: number;
    urgency: 'high' | 'medium' | 'low';
  } | null>(null);

  useEffect(() => {
    async function loadStatus() {
      const statusData = await getFoodAvailabilityStatus(event);
      setStatus(statusData);
    }
    loadStatus();
  }, [event]);

  if (!status) {
    return null; // Loading
  }

  // Don't show notification if no food available
  if (!status.available || status.totalRemaining === 0) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
        <div className="flex items-start gap-2">
          <span className="text-red-600 text-lg">❌</span>
          <div>
            <p className="font-semibold text-red-800">All Food Reserved</p>
            <p className="text-sm text-red-600">This event is fully booked. No food remaining.</p>
          </div>
        </div>
      </div>
    );
  }

  // Show different notifications based on urgency
  if (status.urgency === 'high') {
    return (
      <div className="bg-red-50 border border-red-300 rounded-lg p-3 mb-4">
        <div className="flex items-start gap-2">
          <span className="text-red-600 text-lg">🔥</span>
          <div>
            <p className="font-semibold text-red-800">Limited Food Remaining!</p>
            <p className="text-sm text-red-700">
              Only {status.totalRemaining} portion{status.totalRemaining !== 1 ? 's' : ''} left out of {status.totalCapacity}! 
              Reserve now before it's gone.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status.urgency === 'medium') {
    return (
      <div className="bg-orange-50 border border-orange-300 rounded-lg p-3 mb-4">
        <div className="flex items-start gap-2">
          <span className="text-orange-600 text-lg">⚠️</span>
          <div>
            <p className="font-semibold text-orange-800">Food Running Low</p>
            <p className="text-sm text-orange-700">
              {status.totalRemaining} portion{status.totalRemaining !== 1 ? 's' : ''} remaining out of {status.totalCapacity} ({Math.round(status.percentage)}% available).
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Low urgency - plenty available
  return (
    <div className="bg-green-50 border border-green-300 rounded-lg p-3 mb-4">
      <div className="flex items-start gap-2">
        <span className="text-green-600 text-lg">✅</span>
        <div>
          <p className="font-semibold text-green-800">Food Available</p>
          <p className="text-sm text-green-700">
            {status.totalRemaining} portion{status.totalRemaining !== 1 ? 's' : ''} available out of {status.totalCapacity}.
          </p>
        </div>
      </div>
    </div>
  );
}