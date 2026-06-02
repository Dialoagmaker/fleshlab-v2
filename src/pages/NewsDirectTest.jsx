import React from 'react';

export default function NewsDirectTest() {
  console.log("=== NEWS DIRECT TEST COMPONENT ===");
  console.log("WINDOW_LOCATION_HREF", window.location.href);
  console.log("WINDOW_LOCATION_PATHNAME", window.location.pathname);
  console.log("NEWS_DIRECT_COMPONENT_RENDER_START");
  console.log("================================");
  return (
    <div style={{
      minHeight: "100vh",
      background: "#003333",
      color: "#ffffff",
      padding: "100px",
      fontSize: "36px",
      fontFamily: "Arial",
      position: "relative",
      zIndex: 999999
    }}>
      NEWS DIRECT TEST COMPONENT IS VISIBLE · BUILD V6
      <div style={{ marginTop: '20px', fontSize: '16px', color: '#38b2ac' }}>
        If you see this, React Router is working correctly.
      </div>
    </div>
  );
}