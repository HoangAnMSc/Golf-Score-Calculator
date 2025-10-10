import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

function Home() {
  const [course, setCourse] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [players, setPlayers] = useState(["", "", "", ""]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const savedSetupRaw = localStorage.getItem("gameSetup");
    if (savedSetupRaw) {
      try {
        const saved = JSON.parse(savedSetupRaw);
        setCourse(saved.course || "");
        setDate(saved.date || new Date().toISOString().split("T")[0]);
        setPlayers(
          Array.isArray(saved.players) && saved.players.length
            ? saved.players
            : ["", "", "", ""]
        );
      } catch {
        setCourse("");
        setDate(new Date().toISOString().split("T")[0]);
        setPlayers(["", "", "", ""]);
      }
    } else {
      setCourse("");
      setDate(new Date().toISOString().split("T")[0]);
      setPlayers(["", "", "", ""]);
    }
    setLoading(false);
  }, []);

  const handlePlayerChange = (index, value) => {
    const newPlayers = [...players];
    newPlayers[index] = value;
    setPlayers(newPlayers);
  };

  const validate = () => {
    const errs = {};
    const missingFirstThree = [0, 1, 2].filter((i) => !players[i]?.trim());

    if (!course.trim()) {
      errs.course = "※ゴルフ場名を入力してください。";
      setErrorMessage(errs.course);
      setShowError(true);
    } else if (!date) {
      errs.date = "※日付を選択してください。";
      setErrorMessage(errs.date);
      setShowError(true);
    } else if (missingFirstThree.length > 0) {
      errs.players = "※最初の3人 ( Player 1〜3 ) は必須です。";
      errs.missingIdx = missingFirstThree;
      setErrorMessage(errs.players);
      setShowError(true);
    } else {
      setErrorMessage("");
      setShowError(false);
    }

    const enteredPlayers = players.map((p) => p.trim()).filter(Boolean);

    return { errs, enteredPlayers };
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { errs, enteredPlayers } = validate();

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});

    // Dummy
    const finalPlayers =
      enteredPlayers.length === 3
        ? [...enteredPlayers, "Dummy"]
        : enteredPlayers;

    // Merge Data
    const prev = (() => {
      try {
        return JSON.parse(localStorage.getItem("gameSetup")) || {};
      } catch {
        return {};
      }
    })();

    const payload = {
      ...prev,
      course: course.trim(),
      date,
      players: finalPlayers,
    };

    localStorage.setItem("gameSetup", JSON.stringify(payload));

    navigate("/rule");
  };

  //エーラOK＿ENTER
  const handleCloseError = () => {
    setShowError(false);
  };

  return (
    <div className="container">
      <h2 className="title">Score Calculator</h2>
      <p className="subtitle">A simple way to track your game points.</p>

      {showError && (
        <div className="error-modal">
          <div className="error-modal-content">
            <p>{errorMessage}</p>
            <button onClick={handleCloseError}>OK</button>
          </div>
        </div>
      )}

      <form className="form_container" onSubmit={handleSubmit} noValidate>
        <h3>Game Setup</h3>

        <label>Golf Course</label>
        <input
          type="text"
          value={course}
          onChange={(e) => setCourse(e.target.value)}
          aria-invalid={!!errors.course}
          placeholder="ABC Golf Club"
        />
        {errors.course && <p className="error-text">{errors.course}</p>}

        <label>Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          aria-invalid={!!errors.date}
        />
        {errors.date && <p className="error-text">{errors.date}</p>}

        <label>Players ( 1 - 4 )</label>
        {players.map((player, index) => (
          <input
            key={index}
            type="text"
            placeholder={`Player ${index + 1}${index < 3 ? " *" : ""}`}
            value={player}
            onChange={(e) => handlePlayerChange(index, e.target.value)}
            aria-invalid={
              !!errors.players && index < 3 && !players[index]?.trim()
            }
          />
        ))}
        {errors.players && <p className="error-text">{errors.players}</p>}

        <p className="note">
          Enter 1 to 4 player names. If 3 are entered, a "Dummy" player will be
          added.
        </p>

        <button type="submit" disabled={loading}>
          Set Rules
        </button>
      </form>
    </div>
  );
}

export default Home;
