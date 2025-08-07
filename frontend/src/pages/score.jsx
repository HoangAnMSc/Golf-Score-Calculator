import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../App.css";

const players = ["永田湯島", "住本", "小寺", "小寺"];
const total_score = ["92", "97", "103", "89"];

const Score = () => {
  const navigate = useNavigate();
  const [activePlayerIdx, setActivePlayerIdx] = useState(0);
  const [scores, setScores] = useState(
    players.map(() => ({ score: "", putts: "", ob: 0, bunker: 0, penalty: 0 }))
  );
  const [selectedField, setSelectedField] = useState("score");

  const handleNumberClick = (num) => {
    setScores((prev) => {
      const updated = [...prev];
      updated[activePlayerIdx][selectedField] = String(num);
      return updated;
    });
  };

  const player = players[activePlayerIdx];
  const playerData = scores[activePlayerIdx];

  return (
    <div className="form_container">
      <div className="hole-wapper">
        <h2>Hole 1 | Par 5 | 465Y</h2>
        <h3>{player}'s Turn</h3>
      </div>

      <div className="player-scores">
        {players.map((name, idx) => (
          <div
            key={idx}
            className={`player-row ${idx === activePlayerIdx ? "active" : ""}`}
          >
            <div
              className="player-name"
              onClick={() => setActivePlayerIdx(idx)}
            >
              {name}
            </div>
            <div className="total_score">{total_score[idx]}</div>
            <div className="player-inputs">
              <div
                className={`score-box ${
                  selectedField === "score" && activePlayerIdx === idx
                    ? "selected"
                    : ""
                }`}
                onClick={() => {
                  setSelectedField("score");
                  setActivePlayerIdx(idx);
                }}
              >
                {scores[idx].score || "Score"}
              </div>
              <div
                className={`putts-box ${
                  selectedField === "putts" && activePlayerIdx === idx
                    ? "selected"
                    : ""
                }`}
                onClick={() => {
                  setSelectedField("putts");
                  setActivePlayerIdx(idx);
                }}
              >
                {scores[idx].putts || "Putts"}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="numpad">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button key={num} onClick={() => handleNumberClick(num)}>
            {num}
          </button>
        ))}
      </div>

      <div className="details">
        <div className="detail-row">
          <label>OB</label>
          <button
            onClick={() =>
              setScores((prev) => {
                const updated = [...prev];
                updated[activePlayerIdx].ob += 1;
                return updated;
              })
            }
          >
            +
          </button>
          <span>{playerData.ob}</span>
        </div>
        <div className="detail-row">
          <label>Bunker</label>
          <button
            onClick={() =>
              setScores((prev) => {
                const updated = [...prev];
                updated[activePlayerIdx].bunker += 1;
                return updated;
              })
            }
          >
            +
          </button>
          <span>{playerData.bunker}</span>
        </div>
        <div className="detail-row">
          <label>Penalty</label>
          <button
            onClick={() =>
              setScores((prev) => {
                const updated = [...prev];
                updated[activePlayerIdx].penalty += 1;
                return updated;
              })
            }
          >
            +
          </button>
          <span>{playerData.penalty}</span>
        </div>
      </div>

      <div className="nav_bar">
        <button id="back_btn" type="button" onClick={() => navigate(-1)}>
          Back
        </button>
        <button type="submit">Start Scoring</button>
      </div>
    </div>
  );
};

export default Score;
