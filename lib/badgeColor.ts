/**
 * Returns the badge color style based on the remaining quantity ratio.
 * @param remaining Remaining quantity
 * @param capacity Total quantity
 * @returns Tailwind className string
 */

export const getBadgeClass = (
  remaining: number | null,
  capacity: number
) => {
  if (remaining === null) return "bg-gray-200 text-gray-700";

  if (capacity <= 0) return "bg-gray-200 text-gray-700";

  const ratio = remaining / capacity;

  if (ratio >= 0.5) return "bg-green-100 text-green-700";      // >= 50%
  if (ratio >= 0.2) return "bg-yellow-100 text-yellow-700";    // 20% - 50%
  return "bg-red-100 text-red-700";                           // < 20%
};
