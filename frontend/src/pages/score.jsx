import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../App.css";

const players = ["回答", "リン", "小寺", "田中"];
const total_score = ["92", "97", "103", "89"];

const Score = () => {
  const navigate = useNavigate();
  const [activePlayerIdx, setActivePlayerIdx] = useState(0);
  const [par, setPar] = useState(5);
  const [scores, setScores] = useState(
    players.map(() => ({
      score: "",
      handicap: 0,
      reach: false,
      nearPin: false,
      Eagle: false,
      Albatross: false,
      HoleInOne: false,
      teamColor: "",
    }))
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
  const bonusOptions = [
    { key: "reach", label: "Reach" },
    { key: "nearPin", label: "Near Pin" },
    { key: "Eagle", label: "Eagle" },
    { key: "Albatross", label: "Albatross" },
    { key: "HoleInOne", label: "Hole in One" },
  ];

  // Export current scoreboard to a JSON file
  const handleExport = () => {
    const rows = players.map((name, i) => ({
      player: name,
      totalScore: Number(total_score[i]),
      score: Number(scores[i].score || 0),
      handicap: Number(scores[i].handicap || 0),
      reach: !!scores[i].reach,
      nearPin: !!scores[i].nearPin,
      Eagle: !!scores[i].Eagle,
      Albatross: !!scores[i].Albatross,
      HoleInOne: !!scores[i].HoleInOne,
      teamColor: scores[i].teamColor || "",
    }));

    const payload = {
      course: "ABC's Course",
      hole: "H1",
      par,
      exportedAt: new Date().toISOString(),
      rows,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `golfscore_${new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/[:T]/g, "-")}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container">
      <div className="form_container">
        <h3>ABC's Course</h3>
        <button type="button" className="export_btn" onClick={handleExport}>
          Export File
        </button>
        <div className="hole-wapper">
          <h4>{player}'s Turn</h4>
          <div className="hole-content">
            <span>前半</span>
            <span>H1</span>
          </div>
          <h4>Par {par}</h4>
        </div>

        <div className="score-control">
          <div className="player-map">
            {players.map((name, idx) => {
              const isActive = idx === activePlayerIdx;
              const color = scores[idx].teamColor;
              return (
                <div
                  key={idx}
                  className={`player-tab ${isActive ? "active" : ""}`}
                  onClick={() => setActivePlayerIdx(idx)}
                >
                  <div className="player-name">{name}</div>
                  <div className="total_score">{total_score[idx]}</div>
                  {/* Badge Team */}
                  {color && (
                    <span className={`team-badge team-${color}`}>
                      {color === "red" ? "Red" : "Blue"}
                    </span>
                  )}

                  <div className="player-inputs">
                    <span>Score</span>
                    <div
                      className={`score-box ${
                        selectedField === "score" && activePlayerIdx === idx
                          ? "selected"
                          : ""
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedField("score");
                        setActivePlayerIdx(idx);
                      }}
                    >
                      {scores[idx].score || "0"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="numpad">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button key={num} onClick={() => handleNumberClick(num)}>
                {num}
              </button>
            ))}
          </div>
        </div>

        {/* Team row */}
        <div className="checkbox-row">
          <div className="checkbox-label">Team Color</div>
          <div
            className="checkbox-cell checkbox-pair"
            onClick={(e) => e.stopPropagation()}
          >
            <label
              className={`tag ${
                scores[activePlayerIdx].teamColor === "red"
                  ? "active red"
                  : "red"
              }`}
            >
              <input
                type="checkbox"
                checked={scores[activePlayerIdx].teamColor === "red"}
                onChange={(e) =>
                  setScores((prev) => {
                    const next = [...prev];
                    next[activePlayerIdx].teamColor = e.target.checked
                      ? "red"
                      : "";
                    return next;
                  })
                }
              />
              Red
            </label>

            <label
              className={`tag ${
                scores[activePlayerIdx].teamColor === "blue"
                  ? "active blue"
                  : "blue"
              }`}
            >
              <input
                type="checkbox"
                checked={scores[activePlayerIdx].teamColor === "blue"}
                onChange={(e) =>
                  setScores((prev) => {
                    const next = [...prev];
                    next[activePlayerIdx].teamColor = e.target.checked
                      ? "blue"
                      : "";
                    return next;
                  })
                }
              />
              Blue
            </label>
          </div>
        </div>

        {/* Par row */}
        <div className="counter-row">
          <div className="counter-label">ParScore</div>
          <div className="counter-box">
            <button
              type="button"
              className="circle-btn"
              onClick={() => setPar((p) => Math.max(3, p - 1))}
              aria-label="Decrease Par"
            >
              −
            </button>

            <div className="counter-value">{par}</div>

            <button
              type="button"
              className="circle-btn"
              onClick={() => setPar((p) => Math.min(5, p + 1))}
              aria-label="Increase Par"
            >
              +
            </button>
          </div>
        </div>

        {/* Handicap row */}
        <div className="counter-row">
          <div className="counter-label">Handicap</div>

          <div className="counter-box">
            <button
              type="button"
              className="circle-btn"
              onClick={() =>
                setScores((prev) => {
                  const next = [...prev];
                  next[activePlayerIdx].handicap = Math.max(
                    0,
                    (Number(next[activePlayerIdx].handicap) || 0) - 1
                  );
                  return next;
                })
              }
              aria-label="Decrease handicap"
            >
              −
            </button>

            <div className="counter-value">
              {Number(playerData.handicap || 0)}
            </div>

            <button
              type="button"
              className="circle-btn"
              onClick={() =>
                setScores((prev) => {
                  const next = [...prev];
                  next[activePlayerIdx].handicap = Math.min(
                    36,
                    (Number(next[activePlayerIdx].handicap) || 0) + 1
                  );
                  return next;
                })
              }
              aria-label="Increase handicap"
            >
              +
            </button>
          </div>
        </div>

        {/* Bonuses group */}
        <div className="checkbox-row" onClick={(e) => e.stopPropagation()}>
          {bonusOptions.map(({ key, label }) => (
            <label key={key} className="checkbox-item">
              <input
                type="checkbox"
                checked={!!scores[activePlayerIdx][key]}
                onChange={(e) =>
                  setScores((prev) => {
                    const next = [...prev];
                    next[activePlayerIdx][key] = e.target.checked;
                    return next;
                  })
                }
              />
              {label}
            </label>
          ))}
        </div>

        <div className="nav_bar">
          <button id="back_btn" type="button" onClick={() => navigate("/rule")}>
            Back
          </button>
          <button type="preBtn">Pre</button>
          <button type="nextBtn">Next</button>
        </div>
      </div>
    </div>
  );
};

export default Score;
