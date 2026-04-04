import { useEffect, useState } from "react";

export function isTouchDevice(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    window.matchMedia?.("(pointer: coarse)").matches === true
  );
}

export function isPortraitViewport(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia?.("(orientation: portrait)").matches ?? window.innerHeight >= window.innerWidth;
}

export function useIsTouchDevice(): boolean {
  const [touchDevice, setTouchDevice] = useState(false);

  useEffect(() => {
    const updateTouchDevice = () => {
      setTouchDevice(isTouchDevice());
    };

    updateTouchDevice();

    const mediaQuery = window.matchMedia("(pointer: coarse)");
    mediaQuery.addEventListener("change", updateTouchDevice);
    window.addEventListener("resize", updateTouchDevice);

    return () => {
      mediaQuery.removeEventListener("change", updateTouchDevice);
      window.removeEventListener("resize", updateTouchDevice);
    };
  }, []);

  return touchDevice;
}

export function useIsPortraitViewport(): boolean {
  const [portraitViewport, setPortraitViewport] = useState(false);

  useEffect(() => {
    const updatePortraitViewport = () => {
      setPortraitViewport(isPortraitViewport());
    };

    updatePortraitViewport();

    const mediaQuery = window.matchMedia("(orientation: portrait)");
    mediaQuery.addEventListener("change", updatePortraitViewport);
    window.addEventListener("resize", updatePortraitViewport);

    return () => {
      mediaQuery.removeEventListener("change", updatePortraitViewport);
      window.removeEventListener("resize", updatePortraitViewport);
    };
  }, []);

  return portraitViewport;
}
