import React, { useState, useRef, useEffect, useCallback } from "react";
import YouTubePlayer from "./YouTubePlayer";
import "./styles.css";

// --- Constants ---
// !!! VITAL: REPLACE WITH YOUR KEY !!!
const YOUTUBE_API_KEY = "AIzaSyB3XTdz6tu6zolwoWJLQnEt9dRBl6AEp6k";
const YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search";

// --- Suggestions Config ---
const CORS_PROXY = "https://cors-anywhere.herokuapp.com/"; // Can be unreliable
const SUGGESTIONS_URL = `${CORS_PROXY}http://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=`;
const SUGGESTIONS_DEBOUNCE_DELAY = 350; // ms

function App() {
  // Search State
  const [searchTerm, setSearchTerm] = useState("");
  const [mainSearchResults, setMainSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false); // Main search loading
  const [error, setError] = useState(null); // General error message
  const [lastSearchTerm, setLastSearchTerm] = useState("");

  // Suggestions State
  const [suggestions, setSuggestions] = useState([]);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsDebounceTimeoutRef = useRef(null);
  const searchContainerRef = useRef(null);

  // Player State
  const [currentVideoId, setCurrentVideoId] = useState(null);
  const [currentTrackInfo, setCurrentTrackInfo] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // --- Check API Key on Mount ---
  useEffect(() => {
    if (!YOUTUBE_API_KEY || YOUTUBE_API_KEY === "YOUR_YOUTUBE_API_KEY_HERE") {
      setError(
        "CRITICAL: YouTube API Key is missing or invalid in App.js. Search will not work."
      );
      console.error(
        "CRITICAL: YouTube API Key is missing or invalid in App.js."
      );
    }
  }, []);

  // --- YouTube Data API Search Function ---
  const searchYouTubeVideos = useCallback(
    async (query, isSuggestionClick = false) => {
      console.log(`App: searchYouTubeVideos called with query: "${query}"`);
      if (!query) return;
      if (!YOUTUBE_API_KEY || YOUTUBE_API_KEY === "YOUR_YOUTUBE_API_KEY_HERE") {
        setError(
          "Cannot search: YouTube API Key is missing or invalid in App.js."
        );
        return;
      }
      if (!isSuggestionClick) {
        setShowSuggestions(false);
        setSuggestions([]);
      }
      setIsLoading(true);
      setError(null);
      setLastSearchTerm(query);
      setMainSearchResults([]); // Clear previous results

      const params = new URLSearchParams({
        part: "snippet",
        q: query,
        key: YOUTUBE_API_KEY,
        maxResults: 15,
        type: "video",
        regionCode: "IN",
      });

      try {
        const response = await fetch(`${YOUTUBE_SEARCH_URL}?${params}`);
        const data = await response.json();
        if (!response.ok) {
          const message =
            data.error?.errors?.[0]?.message ||
            data.error?.message ||
            `HTTP error ${response.status}`;
          throw new Error(`YouTube API Error: ${message}`);
        }
        if (!data.items || data.items.length === 0) {
          setError(`No YouTube results found for "${query}".`);
        } else {
          const formattedResults = data.items.map((item) => ({
            id: item.id.videoId,
            title: item.snippet.title,
            artist: item.snippet.channelTitle,
          }));
          setMainSearchResults(formattedResults);
        }
      } catch (e) {
        console.error("App: Search API Error:", e);
        setError(`Search failed: ${e.message}`);
      } finally {
        setIsLoading(false);
      }
    },
    []
  ); // No dependency on YOUTUBE_API_KEY needed as it's a constant defined outside

  // --- Fetch YouTube Suggestions ---
  const fetchYouTubeSuggestions = useCallback(async (query) => {
    // ... (Keep the suggestions fetch logic as before)
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }
    setIsSuggestionsLoading(true);
    try {
      const response = await fetch(
        `${SUGGESTIONS_URL}${encodeURIComponent(query)}`
      );
      if (!response.ok)
        throw new Error(`Suggestion fetch failed (${response.status})`);
      const data = await response.json();
      if (Array.isArray(data?.[1])) {
        setSuggestions(data[1]);
      } else {
        setSuggestions([]);
      }
    } catch (e) {
      console.warn("App: Suggestion Fetch/CORS Error:", e);
      setSuggestions([]);
    } finally {
      setIsSuggestionsLoading(false);
    }
  }, []);

  // --- Debounced Input Handler ---
  const handleInputChange = (event) => {
    // ... (Keep the input handler logic as before)
    const value = event.target.value;
    setSearchTerm(value);
    if (suggestionsDebounceTimeoutRef.current)
      clearTimeout(suggestionsDebounceTimeoutRef.current);
    if (value.trim().length > 1) {
      setShowSuggestions(true);
      setIsSuggestionsLoading(true);
      setSuggestions([]);
      suggestionsDebounceTimeoutRef.current = setTimeout(
        () => fetchYouTubeSuggestions(value),
        SUGGESTIONS_DEBOUNCE_DELAY
      );
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsSuggestionsLoading(false);
    }
  };

  // --- Suggestion Click Handler ---
  const handleSuggestionClick = useCallback(
    (suggestion) => {
      console.log("App: Suggestion clicked:", suggestion);
      setSearchTerm(suggestion);
      setSuggestions([]);
      setShowSuggestions(false);
      searchYouTubeVideos(suggestion, true); // Trigger main search
    },
    [searchYouTubeVideos]
  );

  // --- Click Outside Handler ---
  useEffect(() => {
    // ... (Keep click outside logic as before)
    const handleClickOutside = (event) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target)
      )
        setShowSuggestions(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (suggestionsDebounceTimeoutRef.current)
        clearTimeout(suggestionsDebounceTimeoutRef.current);
    };
  }, []);

  // --- Event Handlers ---
  const handleSearchSubmit = (event) => {
    event.preventDefault();
    console.log("App: Manual search submitted for:", searchTerm);
    if (searchTerm.trim()) {
      setShowSuggestions(false);
      setSuggestions([]); // Hide suggestions
      // Clear player errors, but keep search errors if any
      if (error && currentVideoId) setError(null);
      searchYouTubeVideos(searchTerm);
    }
  };

  const handleVideoSelect = (video) => {
    console.log("App: Video selected:", video.id);
    if (currentVideoId === video.id) {
      // Toggle play/pause only if it's the same video
      setIsPlaying((prev) => !prev);
    } else {
      setError(null); // Clear any previous errors
      setCurrentVideoId(video.id);
      setCurrentTrackInfo(video);
      setIsPlaying(true); // Autoplay new video
    }
  };

  // Play/Pause handled by setting isPlaying state

  // --- YouTube Player Callbacks ---
  const handlePlayerReady = useCallback(() => {
    console.log("App: Player Ready callback received.");
  }, []);

  const handlePlayerStateChange = useCallback((stateCode) => {
    console.log("App: Player State Change callback received:", stateCode);
    if (window.YT?.PlayerState) {
      if (stateCode === window.YT.PlayerState.PLAYING) setIsPlaying(true);
      else if (stateCode === window.YT.PlayerState.PAUSED) setIsPlaying(false);
      else if (stateCode === window.YT.PlayerState.ENDED) setIsPlaying(false);
      // Potentially handle BUFFERING state if needed
    }
  }, []);

  const handlePlayerError = useCallback((errorCode) => {
    console.error(`App: Player Error callback received: ${errorCode}`);
    let message = `Player Error (${errorCode}): `;
    switch (errorCode /* ... error messages ... */) {
      case 2:
        message += "Invalid parameter.";
        break; // Often bad video ID
      case 5:
        message += "HTML5 Player error.";
        break;
      case 100:
        message += "Video not found.";
        break;
      case 101:
      case 150:
        message += "Playback restricted.";
        break;
      default:
        message += "Unknown player error.";
    }
    setError(message);
    setIsPlaying(false);
    // Clear the video that caused the error
    setCurrentVideoId(null);
    setCurrentTrackInfo(null);
  }, []);

  // --- Render Functions ---
  const renderPlayerArea = () => {
    const showPlayerArea =
      currentVideoId || lastSearchTerm || (error && currentVideoId);
    if (!showPlayerArea && !error) {
      return <p className="player-placeholder">Search to begin.</p>;
    }
    if (
      lastSearchTerm &&
      !currentVideoId &&
      !error &&
      mainSearchResults.length === 0
    ) {
      return (
        <p className="player-placeholder">
          No videos found for "{lastSearchTerm}".
        </p>
      );
    }
    if (
      lastSearchTerm &&
      !currentVideoId &&
      !error &&
      mainSearchResults.length > 0
    ) {
      return <p className="player-placeholder">Select a video to play.</p>;
    }
    // Display player error prominently if it occurs while a video *should* be playing
    if (error && currentVideoId) {
      return <div className="error-message player-error">{error}</div>;
    }
    // If search error happened, show it here if no video is selected
    if (error && !currentVideoId) {
      // Error message shown above list, maybe just a simple placeholder here
      return (
        <p className="player-placeholder">Error occurred. See message above.</p>
      );
    }

    return (
      <>
        <div className="track-info">
          {currentTrackInfo && (
            <>
              <h2>{currentTrackInfo.title}</h2>
              <p>{currentTrackInfo.artist}</p>
            </>
          )}
        </div>
        {/* Always render YouTubePlayer when area is visible, pass null videoId if needed */}
        <YouTubePlayer
          videoId={currentVideoId}
          isPlaying={isPlaying}
          onReady={handlePlayerReady}
          onStateChange={handlePlayerStateChange}
          onError={handlePlayerError}
        />
        <div className="youtube-tos-warning">
          <p>
            <strong>Important:</strong> Using YouTube IFrame API.
          </p>
          <p>Adhere to YouTube's Terms of Service.</p>
        </div>
      </>
    );
  };

  const renderSuggestions = () => {
    // ... (Keep suggestions rendering logic as before)
    if (!showSuggestions || !searchTerm) return null;
    return <ul className="suggestions-list">{/* ... list items ... */}</ul>;
  };

  return (
    <div className="app-container">
      {/* --- Search Area --- */}
      <div className="search-container" ref={searchContainerRef}>
        <form onSubmit={handleSearchSubmit}>
          <div className="search-input-wrapper">
            <input
              type="text"
              placeholder="Search YouTube..."
              value={searchTerm}
              onChange={handleInputChange}
              onFocus={() =>
                searchTerm && suggestions.length > 0 && setShowSuggestions(true)
              }
              className="search-input"
              autoComplete="off"
            />
            {renderSuggestions()}
          </div>
          <button
            type="submit"
            className="search-button"
            disabled={
              isLoading ||
              !searchTerm ||
              !YOUTUBE_API_KEY ||
              YOUTUBE_API_KEY === "YOUR_YOUTUBE_API_KEY_HERE"
            }
          >
            {isLoading ? "Searching..." : "Search"}
          </button>
        </form>
        {error && error.includes("API Key Missing") && (
          <div className="error-message api-key-error">{error}</div>
        )}
      </div>

      {/* --- Main Content Area --- */}
      <div className="main-content">
        <div className="track-list-container">
          <h2>
            {lastSearchTerm ? `Results: "${lastSearchTerm}"` : "Search Results"}
          </h2>
          {isLoading && <div className="loading">Loading results...</div>}
          {/* Show search-related error here */}
          {error &&
            !isLoading &&
            !error.includes("API Key Missing") &&
            !error.includes("Player Error") && (
              <div className="error-message">{error}</div>
            )}
          {!isLoading &&
            mainSearchResults.length === 0 &&
            lastSearchTerm &&
            !error && <div className="no-results">No results found.</div>}
          {!isLoading &&
            !lastSearchTerm &&
            mainSearchResults.length === 0 &&
            !error && <div className="no-results">Enter search above.</div>}
          <ul className="track-list youtube-list">
            {mainSearchResults.map((video) => (
              <li
                key={video.id}
                onClick={() => handleVideoSelect(video)}
                className={currentVideoId === video.id ? "active-track" : ""}
                title={`Play ${video.title}`}
              >
                <img
                  src={`https://img.youtube.com/vi/${video.id}/mqdefault.jpg`}
                  alt="thumbnail"
                  className="list-artwork"
                  onError={(e) => {
                    e.target.src = "https://via.placeholder.com/72x54?text=N/A";
                  }}
                />
                <div className="list-track-info">
                  <span>{video.title}</span>
                  {video.artist && <small>{video.artist}</small>}
                </div>
                {currentVideoId === video.id && isPlaying && (
                  <span className="playing-indicator">▶</span>
                )}
                {currentVideoId === video.id && !isPlaying && (
                  <span className="playing-indicator paused">⏸</span>
                )}
              </li>
            ))}
          </ul>
        </div>
        {/* --- Music Player Area --- */}
        <div className="music-player youtube-player-area">
          <h1>YouTube Player</h1>
          {renderPlayerArea()}
        </div>
      </div>
    </div>
  );
}

export default App;
