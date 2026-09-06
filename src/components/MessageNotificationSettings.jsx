"use client";

import { useState, useEffect } from "react";
import { BellIcon, XIcon } from "@/components/icons";

export default function MessageNotificationSettings({ prefs, onChange, onClose }) {
  const [settings, setSettings] = useState(prefs);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleToggle = (key) => {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save preferences to localStorage for persistence
      localStorage.setItem("messageNotificationPrefs", JSON.stringify(settings));
      onChange(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("Failed to save settings:", err);
    } finally {
      setSaving(false);
    }
  };

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("messageNotificationPrefs");
      if (stored) {
        setSettings(JSON.parse(stored));
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
    }
  }, []);

  return (
    <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white p-4 shadow-sm">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BellIcon className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-slate-900">Message Notifications</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-ghost px-2 text-slate-500 hover:text-slate-700"
            aria-label="Close settings"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          {/* Enable Notifications */}
          <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors">
            <div className="flex-1">
              <label className="text-sm font-medium text-slate-900 cursor-pointer">
                Enable message notifications
              </label>
              <p className="text-xs text-slate-500 mt-1">
                Receive alerts when you get new messages
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleToggle("enabled")}
              className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors ${
                settings.enabled ? "bg-blue-600" : "bg-slate-300"
              }`}
              role="switch"
              aria-checked={settings.enabled}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.enabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {settings.enabled && (
            <>
              {/* Sound Notifications */}
              <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors border-l-2 border-blue-200">
                <div className="flex-1">
                  <label className="text-sm font-medium text-slate-900 cursor-pointer">
                    Play sound
                  </label>
                  <p className="text-xs text-slate-500 mt-1">
                    Play an audio alert when a new message arrives
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle("sound")}
                  className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors ${
                    settings.sound ? "bg-blue-600" : "bg-slate-300"
                  }`}
                  role="switch"
                  aria-checked={settings.sound}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.sound ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Desktop Notifications */}
              <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors border-l-2 border-blue-200">
                <div className="flex-1">
                  <label className="text-sm font-medium text-slate-900 cursor-pointer">
                    Desktop notifications
                  </label>
                  <p className="text-xs text-slate-500 mt-1">
                    Show notifications even when the tab is inactive
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle("desktop")}
                  className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors ${
                    settings.desktop ? "bg-blue-600" : "bg-slate-300"
                  }`}
                  role="switch"
                  aria-checked={settings.desktop}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.desktop ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Email Digest */}
              <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors border-l-2 border-blue-200">
                <div className="flex-1">
                  <label className="text-sm font-medium text-slate-900 cursor-pointer">
                    Email digest
                  </label>
                  <p className="text-xs text-slate-500 mt-1">
                    Receive daily summary of new messages via email
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle("emailDigest")}
                  className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors ${
                    settings.emailDigest ? "bg-blue-600" : "bg-slate-300"
                  }`}
                  role="switch"
                  aria-checked={settings.emailDigest}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.emailDigest ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Save and Status */}
        <div className="mt-4 flex items-center justify-end gap-2">
          {saved && (
            <span className="text-xs font-medium text-green-600">✓ Settings saved</span>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || saved}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              saved
                ? "bg-green-50 text-green-700"
                : "bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            }`}
          >
            {saving ? "Saving…" : saved ? "Saved" : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}
