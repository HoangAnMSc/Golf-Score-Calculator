import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../App.css";

function Home() {
  const [course, setCourse] = useState("My Golf Course");
  const [date, setDate] = useState("2025-06-30");
  const [players, setPlayers] = useState(["", "", "", ""]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const api = "http://localhost:5173";
  useEffect(() => {
    axios
      .get(`${api}/home`)
      .then((response) => {
        setData(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Lỗi khi gọi API:", error);
        setLoading(false);
      });
  }, []);

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
    navigate("/rule");
    //Gui toi backend
    // axios
    //   .post(`${api}/home`, {
    //     course,
    //     date,
    //     players: enteredPlayers,
    //   })
    //   .then((res) => {
    //     console.log("Game started:", res.data);
    //   })
    //   .catch((err) => {
    //     console.error("Lỗi gửi dữ liệu:", err);
    //   });
  };

  return (
    <div className="container">
      <h2 className="title">Golf Score Calculator</h2>
      <p className="subtitle">A simple way to track your game points.</p>

      <form className="form_container" onSubmit={handleSubmit}>
        <h3>Game Setup</h3>

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

        <label>Players ( 1 - 4 )</label>
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

export default Home;
