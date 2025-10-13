//Frontend/src/components/Notifications.jsx
import React, { useEffect, useState, useContext } from "react";
import moment from "moment";
import  {AuthContext}   from "../context/AuthContext";
import { io } from "socket.io-client";

export default function Notifications() {
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [socket, setSocket] = useState(null);

  // Fetch notifications once on mount
  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await fetch(`http://localhost:5000/api/requests/notifications/${user.id}`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  // Mark notification as read
  const markAsRead = async (id) => {
    try {
      await fetch(`http://localhost:5000/api/requests/notifications/read/${id}`, {
        method: "POST",
        credentials: "include",
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read_flag: 1 } : n))
      );
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  useEffect(() => {
    if (!user) return;

    fetchNotifications();

    const newSocket = io("http://localhost:5000", { withCredentials: true });
    setSocket(newSocket);

    // Join user-specific room
    newSocket.emit("joinRoom", `farmer_${user.id}`);

    // Listen for real-time notifications
    newSocket.on("newRequest", (notif) => {
      setNotifications((prev) => [notif, ...prev]);
    });

    return () => newSocket.disconnect();
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.read_flag).length;

  return (
    <div className="notification-wrapper relative">
      <div
        className="notification-icon cursor-pointer text-2xl relative"
        onClick={() => setOpen(!open)}
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
        )}
      </div>

      {open && (
        <div className="notification-dropdown absolute right-0 mt-2 w-80 bg-white shadow-lg rounded z-50 max-h-96 overflow-y-auto">
          {notifications.length === 0 && (
            <div className="p-3 text-sm text-gray-500">No notifications</div>
          )}
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => markAsRead(n.id)}
              className={`p-3 border-b cursor-pointer rounded ${
                n.read_flag ? "bg-white text-black" : "bg-blue-50 text-blue-800 font-medium"
              }`}
            >
              <div className="text-sm">
                {user.role === "farmer"
                  ? `You have a new request for ${n.crop_name} ${n.requested_quantity} ${n.unit} at ${n.bid_price} Tk`
                  : n.message}
              </div>
              <div className="text-xs text-gray-500 flex justify-between items-center mt-1">
                {moment(n.created_at).fromNow()}
                {!n.read_flag && <span className="ml-2 text-red-500">●</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
