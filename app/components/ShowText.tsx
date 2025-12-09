export function ShowText({
  popup,
}: {
  popup: { text: string; type: "success" | "error" } | null;
}) {
  if (!popup) return null;

  return (
    <div className="fixed inset-0 flex items-start justify-center mt-24 z-[999] pointer-events-none">
      <div
        className={`px-6 py-3 rounded-lg border pointer-events-auto cursor-pointer shadow-md
          ${
            popup.type === "error"
              ? "bg-red-100 text-red-700 border-red-300"
              : "bg-green-100 text-green-700 border-green-300"
          }
        `}
      >
        {popup.text}
      </div>
    </div>
  );
}