"use client";

import { useRouter } from "next/navigation";

/**
 * The landing page's main call to action. If the app was closed and
 * reopened (a fresh browser session), it sends you through the sign-in
 * screen to re-enter your password or Face ID; within the same open
 * session it goes straight in.
 */
export function GetAccessButton() {
  const router = useRouter();
  function go() {
    let unlocked = false;
    try {
      unlocked = sessionStorage.getItem("laura_session_open") === "1";
    } catch {
      // no sessionStorage -- treat as a fresh open and ask to sign in
    }
    router.push(unlocked ? "/laura" : "/login?next=%2Flaura");
  }
  return (
    <button onClick={go} className="btn btn-primary btn-hero mt-8 !px-6 !py-3">
      Get access
    </button>
  );
}
