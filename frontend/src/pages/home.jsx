import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

function Home() {
  const [course, setCourse] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [players, setPlayers] = useState(["", "", "", ""]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const savedSetup = localStorage.getItem("gameSetup");
    if (savedSetup) {
      const gameData = JSON.parse(savedSetup);
      setCourse(gameData.course || "");
      setDate(gameData.date || new Date().toISOString().split("T")[0]);
      console.log(gameData.players);
      setPlayers(gameData.players || ["", "", "", ""]);
    } else {
      setCourse("");
      setDate(new Date().toISOString().split("T")[0]);
      setPlayers(["", "", "", ""]);
    }

    // Sau khi load dữ liệu xong, set loading thành false
    setLoading(false); // Đảm bảo nút Set Rules được bật
  }, []);

  const handlePlayerChange = (index, value) => {
    const newPlayers = [...players];
    newPlayers[index] = value;
    setPlayers(newPlayers);
  };

  const validate = () => {
    const errs = {};
    if (!course.trim()) errs.course = "※ゴルフ場名を入力してください。";
    if (!date) errs.date = "※日付を選択してください。";

    const enteredPlayers = players.map((p) => p.trim()).filter(Boolean);
    if (enteredPlayers.length < 3) {
      errs.players = "※少なくとも3人を入力してください。";
    }
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

    if (enteredPlayers.length === 3) {
      enteredPlayers.push("Dummy");
    }

    const payload = {
      course: course.trim(),
      date,
      players: enteredPlayers, // Đảm bảo players được lưu đúng
    };

    // Lưu dữ liệu vào localStorage
    localStorage.setItem("gameSetup", JSON.stringify(payload));

    console.log("Game Setup:", payload);
    navigate("/rule");
  };

  return (
    <div className="container">
      <h2 className="title">Golf Score Calculator</h2>
      <p className="subtitle">A simple way to track your game points.</p>

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
            placeholder={`Player ${index + 1}`}
            value={player}
            onChange={(e) => handlePlayerChange(index, e.target.value)}
            aria-invalid={!!errors.players}
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
