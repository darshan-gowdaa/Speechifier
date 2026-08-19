import { useEffect, useRef } from "react";

interface Props {
  isDragging: boolean;
}

export function HeroVideo({ isDragging }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.defaultMuted = true;
    video.muted = true;
    
    // Explicitly set playsinline attribute
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");

    const playVideo = async () => {
      try {
        await video.play();
      } catch (err) {
        // Silently handle autoplay prevention
      }
    };

    playVideo();

    const handleTouch = () => {
      if (video && video.paused) playVideo();
    };
    window.addEventListener("touchstart", handleTouch, { once: true });
    window.addEventListener("click", handleTouch, { once: true });
    
    return () => {
      window.removeEventListener("touchstart", handleTouch);
      window.removeEventListener("click", handleTouch);
    };
  }, []);

  return (
    <div className={`hero-video-wrapper transition-opacity duration-300 ${isDragging ? "opacity-30" : "opacity-100"}`}>
      <video ref={videoRef} className="hero-photo anim-fade-in" autoPlay loop muted playsInline preload="auto" disablePictureInPicture>
        <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260813_115057_94c3699b-0fd1-4124-bcf3-3626bb8c1f77.mp4" type="video/mp4" />
      </video>
    </div>
  );
}
