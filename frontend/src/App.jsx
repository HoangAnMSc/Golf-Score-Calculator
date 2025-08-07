import React, { useState } from "react";
import "./App.css";

function App() {
  const [course, setCourse] = useState("My Golf Course");
  const [date, setDate] = useState("2025-06-30");
  const [players, setPlayers] = useState(["", "", "", ""]);

  const handlePlayerChange = (index, value) => {
    const newPlayers = [...players];
    newPlayers[index] = value;
    setPlayers(newPlayers);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const enteredPlayers = players.filter((name) => name.trim() !== "");
    if (enteredPlayers.length === 3) {
      enteredPlayers.push("Dummy");
    }

    const data = {
      course,
      date,
      players: enteredPlayers,
    };

    console.log("Game Setup:", data);
    // Here you would navigate or call API to move to next step
  };

  return (
    <div className="container">
      <h1 className="title">🏌️ Golf Score Calculator</h1>
      <p className="subtitle">A simple way to track your game points.</p>

      <form className="card" onSubmit={handleSubmit}>
        <h2>Game Setup</h2>

        <label>Golf Course</label>
        <input
          type="text"
          value={course}
          onChange={(e) => setCourse(e.target.value)}
        />

        <label>Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        <label>Players (1–4)</label>
        {players.map((player, index) => (
          <input
            key={index}
            type="text"
            placeholder={`Player ${index + 1}`}
            value={player}
            onChange={(e) => handlePlayerChange(index, e.target.value)}
          />
        ))}

        <p className="note">
          Enter 1 to 4 player names. If 3 are entered, a "Dummy" player will be
          added.
        </p>

        <button type="submit">Set Rules</button>
      </form>
    </div>
  );
}

export default App;
