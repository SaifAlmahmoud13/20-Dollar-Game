import { createContext, useContext, useEffect, useState } from 'react';

// The game screens are landscape (unless Portrait mode is on); the menus are portrait.
// Phones get the right layout whichever way they're held: if the screen won't turn,
// the game turns its own view 90 degrees (like the original app), so players just
// hold the phone sideways.
export const LayoutContext = createContext({ landscape: false });
export const useLayout = () => useContext(LayoutContext);

const isTypingTarget = (el) => el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA');

function useViewport() {
  const read = () => ({ w: window.innerWidth, h: window.innerHeight });
  const [vp, setVp] = useState(read);
  useEffect(() => {
    const onResize = () =>
      setVp((prev) => {
        const next = read();
        // The on-screen keyboard shrinks the viewport; don't re-layout the game for it.
        if (isTypingTarget(document.activeElement) && next.w === prev.w && next.h < prev.h) return prev;
        return next;
      });
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, []);
  return vp;
}

const isPhone = () => window.matchMedia?.('(pointer: coarse)').matches && Math.min(window.screen.width, window.screen.height) < 820;

export function useOrientation(wantLandscape) {
  const vp = useViewport();

  // Ask the phone to turn the screen (works in the installed app on many phones);
  // if it can't, the view is rotated below instead.
  useEffect(() => {
    window.screen?.orientation?.lock?.(wantLandscape ? 'landscape' : 'portrait').catch(() => {});
  }, [wantLandscape]);

  const deviceLandscape = vp.w > vp.h;
  const mismatch = wantLandscape !== deviceLandscape;
  const rotate = mismatch && isPhone() ? (wantLandscape ? 90 : -90) : 0;
  const landscape = rotate ? wantLandscape : wantLandscape && deviceLandscape;

  // The rotated view is the screen turned on its side: its width is the screen's height.
  const style = rotate
    ? {
        width: vp.h,
        height: vp.w,
        transformOrigin: 'top left',
        transform: rotate === 90 ? `translateX(${vp.w}px) rotate(90deg)` : `translateY(${vp.h}px) rotate(-90deg)`,
      }
    : undefined;

  return { landscape, rotated: !!rotate, style };
}
