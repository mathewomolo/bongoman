/* A one number bridge from PlexusField to CustomCursor.

   Deliberately a plain mutable object rather than React state, a
   context or a custom event. The value changes on every animation
   frame while the button is held, and all three of those alternatives
   would turn a frame counter into either a re-render or an event
   dispatch sixty times a second.

   PlexusField is the only writer. CustomCursor is the only reader, and
   it reads inside a loop it already runs, so this costs one property
   access per frame and nothing else.

   captured: how many stars are currently inside the cursor's capture
   radius while the button is down. Zero whenever it is not. */
export const plexusSignal = { captured: 0 };