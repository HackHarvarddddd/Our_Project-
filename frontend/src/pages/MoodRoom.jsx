import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import useSound from "use-sound";
import "../styles/MoodRoom.css";

/**
 * MoodRoom
 * Group "mood room" that matches the visual language from the second screenshot,
 * adapted for a multi-person room. Frosted glass panel, big wave icon, "Now playing",
 * participant chips with short bios + invite buttons.
 */
export default function MoodRoom() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Mood and demo song
  const mood = searchParams.get("mood") || "Calm";
  const song = useMemo(
    () => ({ title: "Claire De Lune", artist: "Debussy" }),
    []
  );

  // Demo people in this room (replace with API later)
  const [people, setPeople] = useState([
    { id: "1", name: "Alice", summary: "Loves peaceful walks in nature." },
    { id: "2", name: "Bob", summary: "Enjoys meditating and yoga." },
    { id: "3", name: "Charlie", summary: "Finds calmness in painting." },
  ]);

  // Simple audio play/pause
  const [isPlaying, setIsPlaying] = useState(false);
  const [play, controls] = useSound("../../assets/music/song.mp3", {
    volume: 0.8,
    interrupt: true,
    onend: () => setIsPlaying(false),
  });

  const togglePlay = () => {
    if (isPlaying) {
      controls.stop();
      setIsPlaying(false);
    } else {
      play();
      setIsPlaying(true);
    }
  };

  const leaveRoom = () => {
    controls.stop?.();
    navigate("/home");
  };

  const inviteUser = (p) => {
    // Wire up to backend later; this is UI only
    alert(`Invitation sent to ${p.name} 💌`);
  };

  return (
    <div className="mood-room">
      <header className="crumb">
        <h1 className="crumb-title">Mood Room</h1>
        <div className="crumb-sub">Mood: <span className="pill">{mood}</span></div>
      </header>

      <section className="glass-card">
        <div className="room-grid">
          {/* LEFT: Title, now playing + wave */}
          <div className="stage">
            <h2 className="room-title">
              You’re in the <span className="mood">{mood}</span> room
            </h2>
            <p className="subtitle">
              People here vibe the same way. Relax, listen together, and connect.
            </p>

            <div className="now-playing">
              <button className={`play-btn ${isPlaying ? "is-playing" : ""}`} onClick={togglePlay}>
                {isPlaying ? "Pause" : "Play"}
              </button>
              <div className="np-meta">
                <div className="np-label">Now playing</div>
                <div className="np-song">
                  {song.title} <span className="np-artist">by {song.artist}</span>
                </div>
              </div>
            </div>

            <div className={`equalizer ${isPlaying ? "animate" : ""}`} aria-hidden="true">
              {Array.from({ length: 17 }).map((_, i) => (
                <span key={i} style={{ ["--i"]: i }} />
              ))}
            </div>

            <div className="stage-cta">
              <div className="tiny-hint">Press Play to animate the room.</div>
              <button className="leave-btn" onClick={leaveRoom}>Leave the room</button>
            </div>
          </div>

          {/* RIGHT: Participants */}
          <aside className="participants">
            <div className="part-head">
              <h3>People in this room <span className="count">({people.length})</span></h3>
            </div>
            <ul className="people-list">
              {people.map((p) => (
                <li key={p.id} className="person">
                  <div className="avatar" aria-hidden="true">{p.name[0]}</div>
                  <div className="meta">
                    <div className="name">{p.name}</div>
                    <div className="bio">{p.summary}</div>
                  </div>
                  <button className="invite" onClick={() => inviteUser(p)}>
                    Invite to schedule
                  </button>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </section>
    </div>
  );
}
