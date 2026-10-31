// Remembers, per browser, that a passkey exists for this site. Without it the
// login page would offer Face ID on devices with no passkey here, and iOS
// answers that with a "scan this QR code" prompt for another device.
const FLAG = "laura_passkey_here";

export function markPasskeyHere() {
  try {
    localStorage.setItem(FLAG, "1");
  } catch {
    // storage blocked: Face ID stays one tap away instead of opening itself
  }
}

export function hasPasskeyHere(): boolean {
  try {
    return localStorage.getItem(FLAG) === "1";
  } catch {
    return false;
  }
}
