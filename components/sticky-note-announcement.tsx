import { useState, useEffect } from "react"
import { IconX, IconPin } from "@tabler/icons-react"
const ANNOUNCEMENT_KEY = "announcementDismissed_v2_1_0b2";

export default function StickyNoteAnnouncement() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const dismissed = localStorage.getItem(ANNOUNCEMENT_KEY)
    if (!dismissed) setIsVisible(true)
  }, [])

  const handleDismiss = () => {
    localStorage.setItem(ANNOUNCEMENT_KEY, "true")
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <div className="z-0 bg-white dark:bg-zinc-800 rounded-xl shadow-sm p-4 flex items-start space-x-4 mb-6 relative">
      <img
        src="/favicon-32x32.png"
        alt="Orbit"
        className="w-10 h-10 rounded-full bg-primary flex-shrink-0"
      />
      <div>
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-1 flex items-center gap-1">
          <IconPin className="w-4 h-4 text-zinc-500 dark:text-zinc-300" />
          Planetary
        </h3>

    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0"></p>
    <div className="text-zinc-800 dark:text-zinc-300 text-sm space-y-2">
      <p>
        👋 <strong>Orbit v2.1.0beta2 is live!</strong> — A few sweet treats 🍬
        <br />
        Here’s what’s new since the last announcement:
      </p>

      <p className="mt-4 font-semibold">🟢 Live Session Tracking</p>
      <p>
        Live sessions now show real-time duration updates in your profile activity.
      </p>

      <p className="mt-4 font-semibold">🚪 OAuth Support</p>
      <p>
        Orbit now supports OAuth for Roblox. Developers can create apps that connect with Orbit securely and easily.
      </p>

      <p className="mt-4 font-semibold">🐛 Bug Fixes</p>
      <ul className="list-disc list-inside space-y-1">
        <li>We've resolved issues with Activity Tracking on Cloud instances.</li>
        <li>Owner role now has priority over other workspace roles preventing softlocking.</li>
        <li>Speed improvement updates pushed soon improving overall performance.</li>
      </ul>

      <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">
        Orbit remains in <em>beta</em>. We’re iterating fast — thank you for testing, reporting, and shaping the platform. 🛰️
      </p>
    </div>
      </div>
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
        aria-label="Close announcement"
      >
        <IconX className="w-5 h-5" />
      </button>
    </div>
  )
}
