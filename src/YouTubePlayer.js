import React, { useEffect, useRef, memo, useState } from "react";

const YouTubePlayer = memo(
  ({ videoId, isPlaying, onReady, onStateChange, onError }) => {
    const playerRef = useRef(null);
    const containerRef = useRef(null); // Ref for the container div
    const internalStateRef = useRef({ videoId: null, isReady: false }); // Track internal state

    // State to trigger re-renders when API/Player becomes ready
    const [isPlayerReady, setIsPlayerReady] = useState(false);

    // --- Effect 1: Load YouTube IFrame API Script ---
    useEffect(() => {
      console.log("YTPlayer Effect 1: Mount - Loading API Script Check");
      // Function to load the API script
      const loadScript = () => {
        console.log("YTPlayer: Loading API script...");
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        document.body.appendChild(tag);
        window.onYouTubeIframeAPIReady = () => {
          console.log("YTPlayer: window.onYouTubeIframeAPIReady called!");
          // Attempt player creation now that API is presumably ready
          createPlayerIfNeeded();
        };
      };

      // Load script only if YT object or Player constructor is missing
      if (!window.YT?.Player) {
        // Check if script is already loading/loaded by another instance (simple check)
        if (
          !document.querySelector(
            'script[src="https://www.youtube.com/iframe_api"]'
          )
        ) {
          loadScript();
        } else if (window.YT?.Player) {
          // Script tag exists, YT.Player exists - API is ready
          console.log("YTPlayer: API already loaded (script tag found).");
          createPlayerIfNeeded(); // Attempt creation if needed
        } else {
          // Script tag exists, but YT.Player doesn't - wait for callback
          console.log(
            "YTPlayer: API script tag found, waiting for onYouTubeIframeAPIReady..."
          );
        }
      } else {
        console.log("YTPlayer: API already loaded (window.YT.Player exists).");
        // API is ready, attempt player creation immediately if needed
        createPlayerIfNeeded();
      }

      // No cleanup needed for script loading typically
    }, []); // Runs once on mount

    // --- Effect 2: Create Player or Load Video when videoId prop changes ---
    useEffect(() => {
      console.log(`YTPlayer Effect 2: videoId prop changed to "${videoId}"`);
      // Ensure container exists before proceeding
      if (!containerRef.current) {
        console.log("YTPlayer Effect 2: Container ref not available yet.");
        return;
      }
      // Wait for API to be ready (check the actual Player constructor)
      if (!window.YT?.Player) {
        console.log("YTPlayer Effect 2: YT API not ready yet.");
        return; // Wait for API callback
      }

      // Create player if it doesn't exist AND we have a videoId
      if (videoId && !playerRef.current) {
        console.log(
          `YTPlayer Effect 2: Creating player with videoId "${videoId}"`
        );
        createPlayer(videoId);
      }
      // Load new video if player exists AND videoId prop is different and valid
      else if (
        videoId &&
        playerRef.current &&
        internalStateRef.current.videoId !== videoId
      ) {
        console.log(`YTPlayer Effect 2: Loading new video "${videoId}"`);
        if (typeof playerRef.current.loadVideoById === "function") {
          playerRef.current.loadVideoById(videoId);
          internalStateRef.current.videoId = videoId;
        } else {
          console.warn("YTPlayer: loadVideoById not ready?");
        }
      }
      // Handle videoId becoming null (stop video)
      else if (
        !videoId &&
        playerRef.current &&
        internalStateRef.current.videoId
      ) {
        console.log("YTPlayer Effect 2: videoId became null, stopping video.");
        if (typeof playerRef.current.stopVideo === "function") {
          playerRef.current.stopVideo();
        }
        internalStateRef.current.videoId = null;
        // Consider setting internal ready state to false?
        // internalStateRef.current.isReady = false;
        // setIsPlayerReady(false);
      }
    }, [videoId]); // Depend only on videoId prop

    // --- Effect 3: Control Play/Pause based on isPlaying prop ---
    useEffect(() => {
      console.log(
        `YTPlayer Effect 3: isPlaying prop changed to "${isPlaying}", Player ready: ${isPlayerReady}`
      );
      // Only act if player exists and is ready
      if (playerRef.current && internalStateRef.current.isReady) {
        try {
          const playerState = playerRef.current.getPlayerState();
          if (isPlaying && playerState !== window.YT.PlayerState.PLAYING) {
            console.log("YTPlayer Effect 3: Calling playVideo()");
            playerRef.current.playVideo();
          } else if (
            !isPlaying &&
            playerState === window.YT.PlayerState.PLAYING
          ) {
            console.log("YTPlayer Effect 3: Calling pauseVideo()");
            playerRef.current.pauseVideo();
          }
        } catch (error) {
          console.error(
            "YTPlayer Effect 3: Error getting player state or controlling playback",
            error
          );
          // Maybe the player was destroyed unexpectedly?
        }
      } else {
        console.log(
          "YTPlayer Effect 3: Skipping - Player not ready or doesn't exist."
        );
      }
    }, [isPlaying, isPlayerReady]); // Depend on isPlaying AND isPlayerReady

    // --- Function to Create Player ---
    const createPlayerIfNeeded = () => {
      // Call this when API is ready and we might need to create the player
      if (
        window.YT?.Player &&
        containerRef.current &&
        !playerRef.current &&
        videoId
      ) {
        console.log(
          `YTPlayer: createPlayerIfNeeded - Creating player now for initial videoId "${videoId}"`
        );
        createPlayer(videoId);
      } else {
        console.log(
          "YTPlayer: createPlayerIfNeeded - Conditions not met or player exists."
        );
      }
    };

    const createPlayer = (initialVideoId) => {
      console.log(
        `YTPlayer: createPlayer function executing for ${initialVideoId}`
      );
      internalStateRef.current.isReady = false; // Mark as not ready until onReady fires
      setIsPlayerReady(false);
      try {
        playerRef.current = new window.YT.Player(containerRef.current.id, {
          videoId: initialVideoId,
          playerVars: {
            playsinline: 1,
            autoplay: isPlaying ? 1 : 0,
            controls: 1,
          },
          events: {
            onReady: handlePlayerReady,
            onStateChange: handlePlayerStateChange,
            onError: handlePlayerError,
          },
        });
        internalStateRef.current.videoId = initialVideoId;
        console.log("YTPlayer: Player instance created.");
      } catch (error) {
        console.error("YTPlayer: Error during new YT.Player():", error);
        if (onError) onError("Player creation failed."); // Pass generic error up
      }
    };

    // --- Player Event Handlers ---
    const handlePlayerReady = (event) => {
      console.log("YTPlayer: Player Ready event received.");
      internalStateRef.current.isReady = true;
      setIsPlayerReady(true); // Update state to trigger effects depending on readiness
      if (onReady) onReady(event);
      // If isPlaying was true when component mounted/video loaded, start playback now
      if (isPlaying) {
        console.log(
          "YTPlayer: Player ready, calling playVideo() due to initial isPlaying=true"
        );
        event.target.playVideo();
      }
    };

    const handlePlayerStateChange = (event) => {
      console.log("YTPlayer: State Change event received:", event.data);
      if (onStateChange) onStateChange(event.data);
    };

    const handlePlayerError = (event) => {
      console.error("YTPlayer: Error event received:", event.data);
      internalStateRef.current.isReady = false; // Player might be unusable
      setIsPlayerReady(false);
      if (onError) onError(event.data); // Pass error code up
    };

    // --- Effect 5: Cleanup on Unmount ---
    useEffect(() => {
      const playerInstance = playerRef.current; // Capture instance
      const containerElement = containerRef.current;
      return () => {
        console.log("YTPlayer Effect 5 (Cleanup): Running for UNMOUNT.");
        if (playerInstance && typeof playerInstance.destroy === "function") {
          try {
            // No need to check container, destroy should handle internal cleanup
            console.log("YTPlayer Cleanup: Calling player.destroy()");
            playerInstance.destroy();
          } catch (error) {
            console.error("YTPlayer Cleanup: Error destroying player:", error);
          }
        } else {
          console.log("YTPlayer Cleanup: No valid player instance to destroy.");
        }
        playerRef.current = null; // Clear the ref on unmount
        internalStateRef.current = { videoId: null, isReady: false }; // Reset internal state
      };
    }, []); // Runs only on unmount

    // Unique ID for the container
    const playerContainerId = `ytplayer-${React.useId()}`;

    return (
      <div
        ref={containerRef}
        id={playerContainerId}
        className="youtube-player-container"
      >
        {/* Iframe inserted here */}
      </div>
    );
  }
);

export default YouTubePlayer;
