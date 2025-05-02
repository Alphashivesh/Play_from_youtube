# 🎵 React YouTube Music Player with Search & Suggestions

[Live Demo 🚀](https://play-from-youtube.vercel.app/) | Created with CodeSandbox

---

## Overview

**React YouTube Music Player** is a modern, interactive web application built using React that enables users to:

- Search for music videos on YouTube.
- Get real-time autocomplete suggestions.
- Browse search results.
- Play selected videos within a sleek, custom-styled interface.

It uses the **YouTube Data API v3** for searching and the **YouTube IFrame Player API** for playback functionality.

---

## 🌟 Core Features

- 🔍 **YouTube Video Search**  
  Search YouTube using the Data API v3 based on user input (e.g., song titles, artists), biased toward a region (like India/Bollywood).

- 🧠 **Real-time Search Suggestions**  
  Autocomplete suggestions appear as the user types, powered by an undocumented Google suggestions endpoint (CORS proxy required).

- 🖼️ **Dynamic Results Display**  
  Scrollable list of video results with thumbnails, titles, and channel info.

- ▶️ **Integrated Video Playback**  
  Embedded YouTube player using the IFrame API for seamless video playback within the app.

- ⏯️ **Playback State Management**  
  Basic controls and visual feedback for play/pause state.

- 💅 **Customizable & Modern UI**  
  Fully responsive UI styled with:
  - CSS Variables
  - Flexbox/Grid Layout
  - Smooth transitions and modern shadows

---

## ⚙️ Technology Stack

- **Frontend:** React (v18+) with Hooks
- **Styling:** CSS3 (Flexbox, Grid, CSS Variables)
- **Languages:** JavaScript (ES6+)
- **APIs Used:**
  - YouTube Data API v3 (Search)
  - YouTube IFrame Player API (Playback)
  - Google Suggest Queries API (Autocomplete – undocumented)

---

## 🔧 Key Implementation Details

- **Asynchronous Fetching:** Fetch API used for search results and suggestions.
- **YouTube IFrame Integration:** Dynamic loading of external player API.
- **State Management:** React `useState`, `useEffect`, `useRef`, and `useCallback`.
- **Debounced Input:** Limits API requests while typing for better performance.
- **Event Handling:** React event-driven UI interactions.
- **Cleanup Logic:** Lifecycle-aware iframe handling in custom `YouTubePlayer` component.

---

## 🛠️ Setup Instructions

1. **Clone the Repository**
   ```bash
   git clone https://github.com/your-username/react-youtube-music-player.git
   cd react-youtube-music-player
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Insert Your API Key**
   Open `src/App.js` and update this line:
   ```js
   const YOUTUBE_API_KEY = "YOUR_YOUTUBE_API_KEY_HERE";
   ```

4. **Run the App**
   ```bash
   npm start
   ```

---

## ⚠️ Limitations & Considerations

- **YouTube Terms of Service:**  
  Do **not** modify playback to remove video – **audio-only players are against YouTube’s ToS**.

- **Suggestions Endpoint:**  
  Relies on an **undocumented** Google API. May break without notice and requires a CORS proxy.

- **API Quotas:**  
  Daily quotas apply to the YouTube Data API usage. Monitor usage via the Google Cloud Console.

- **Playback Restrictions:**  
  Some videos may include ads or have regional/embedding restrictions.

---

## 📄 License

This project is for educational purposes and must comply with [YouTube API Services Terms of Service](https://developers.google.com/youtube/terms/api-services-terms-of-service).
