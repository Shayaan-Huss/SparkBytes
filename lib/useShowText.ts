import { useState } from "react";

export function useShowText() {
  const [popup, setPopup] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showText = (text: string, type: "success" | "error") => {
    setPopup({ text, type });
    setTimeout(() => setPopup(null), 1000);
  };

  return { popup, showText };
}