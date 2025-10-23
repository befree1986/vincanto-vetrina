// src/components/GuestFeedback.tsx
import React from "react";
import "./GuestFeedback.css";

const feedbackData = [
  {
    source: "Booking.com",
    text: "Soggiorno meraviglioso! Accoglienza impeccabile e comfort assoluto.",
    icon: "/icons/booking.svg",
    link: "https://www.booking.com/hotel/it/vincanto-maiori-costiera-amalfitana.it.html?force_referer=https%3A%2F%2Fwww.google.com%2F&activeTab=main"
  },
  {
    source: "Airbnb",
    text: "Un'esperienza perfetta. La casa è splendida e in ottima posizione.",
    icon: "/icons/airbnb.svg",
    link: "https://www.airbnb.it/rooms/1387891577187940063?source_impression_id=p3_1752002400_P3igXnrRx0t0fqsA"
  },
  {
    source: "Google Reviews",
    text: "Pulizia, cortesia e una vista mozzafiato. Consigliatissimo!",
    icon: "/icons/google.svg",
    link: "https://www.google.com/maps/place/Vincanto+Maiori+Costiera+Amalfitana/@40.6709131,14.6457049,17z/data=!3m1!4b1!4m6!3m5!1s0x133bbf759bd276b7:0x49b8fbf1f67d6fb7!8m2!3d40.6709131!4d14.6457049!16s%2Fg%2F11x62h4fbh?entry=ttu&g_ep=EgoyMDI1MDcyMy4wIKXMDSoASAFQAw%3D%3D"
  },
];

const GuestFeedback: React.FC = () => {
  return (
    <section id="guest-feedback" className="elegant-section">
      <h2>🌟 Dicono di Noi</h2>
      <div className="feedback-grid">
        {feedbackData.map((item, index) => (
          <blockquote key={index} className="feedback-card">
            <img src={item.icon} alt={item.source} className="source-icon" />
            <p>"{item.text}"</p>
            <span>{item.source}</span>
          </blockquote>
        ))}
      </div>
    </section>
  );
};

export default GuestFeedback;