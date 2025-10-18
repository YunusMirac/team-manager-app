import { useEffect } from "react";

interface ToastProps {
  message: string;
  type?: "success" | "error";
  onClose: () => void;
}

export default function Toast({ message, type = "success", onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000); // Toast nach 3 Sekunden automatisch schließen
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      style={{
        position: "fixed",
        top: "20px",
        right: "20px",
        padding: "12px 20px",
        borderRadius: "8px",
        backgroundColor: type === "error" ? "#e74c3c" : "#2ecc71",
        color: "#fff",
        fontWeight: "bold",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        zIndex: 1000,
      }}
    >
      {message}
    </div>
  );
}
