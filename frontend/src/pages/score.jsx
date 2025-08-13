import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../App.css";

const Score = () => {
  const navigate = useNavigate();
  const { state } = useLocation() || {};
  const players =
    state?.players && state.players.length > 0
      ? state.players
      : ["P1", "P2", "P3", "P4"];

  const courseName = state?.course || "ABC's Course";
  const frontName = state?.frontname || "前半";
  const rulesFromRule = state?.rules || null;

  // Map Rule name -> key trong scores
  const ruleKeyMap = {
    "Reach Declaration": "reach",
    "Near Pin Bonus": "nearPin",
    // "Eagle Bonus": "Eagle",
    // "Albatross Bonus": "Albatross",
    // "Hole-in-One Bonus": "HoleInOne",
  };

  const enabledBonusKeys = rulesFromRule
    ? new Set(
        Object.entries(rulesFromRule)
          .filter(([name, on]) => on === true)
          .map(([name]) => ruleKeyMap[name])
          .filter(Boolean)
      )
    : null;

  const showHandicap =
    rulesFromRule?.Handicap !== undefined ? !!rulesFromRule.Handicap : true;

  const [activePlayerIdx, setActivePlayerIdx] = useState(0);
  const [par, setPar] = useState(4);
  const [totalscore, setTotalscore] = useState(0);
  const [scores, setScores] = useState(
    players.map(() => ({
      score: "",
      handicap: 0,
      reach: false,
      nearPin: false,
      teamColor: "red",
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

  const setTeamColor = (idx, color, checked) => {
    setScores((prev) => {
      const next = [...prev];
      if (!checked) {
        if (next[idx].teamColor === color) next[idx].teamColor = "";
      } else {
        next[idx].teamColor = color; // bật color này, tắt color còn lại
      }
      return next;
    });
  };

  const bonusOptions = [
    { key: "reach", label: "Reach" },
    { key: "nearPin", label: "Near Pin" },
    // { key: "Eagle", label: "Eagle" },
    // { key: "Albatross", label: "Albatross" },
    // { key: "HoleInOne", label: "Hole in One" },
  ];

  const visibleBonusOptions = enabledBonusKeys
    ? bonusOptions.filter((opt) => enabledBonusKeys.has(opt.key))
    : bonusOptions;

  // Export JSON
  const handleExport = () => {
    const rows = players.map((name, i) => ({
      player: name,
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
      course: courseName,
      front9: frontName,
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

  const player = players[activePlayerIdx];
  const playerData = scores[activePlayerIdx];

  return (
    <div className="container">
      <h2 className="title">Golf Score Calculator</h2>
      <p className="subtitle">A simple way to track your game points.</p>

      <div className="form_container">
        {/* Export File */}
        <button type="button" className="export_btn" onClick={handleExport}>
          Export File
        </button>

        <div className="hole-wapper">
          <h4>{courseName}</h4>
          <div className="hole-content">
            <span>{frontName}</span>
            <span>H1</span>
          </div>
          <div>
            Par
            <div className="counter-box">
              <button
                type="button"
                className="circle-btn"
                onClick={() => setPar((p) => Math.max(3, p - 1))}
                aria-label="Decrease Par"
              >
                -
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
                  <div className="total_score">{totalscore}</div>

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
        <div className="rule_container" onClick={(e) => e.stopPropagation()}>
          <div className="rule_item">
            <span>Team: Red</span>
            <label className="switch">
              <input
                type="checkbox"
                checked={scores[activePlayerIdx].teamColor === "blue"}
                onChange={(e) => {
                  setScores((prev) => {
                    const next = [...prev];
                    next[activePlayerIdx].teamColor = e.target.checked
                      ? "blue"
                      : "red";
                    return next;
                  });
                }}
                onClick={(e) => e.stopPropagation()}
              />
              <span className="slider"></span>
            </label>
            <span>Blue</span>
          </div>
        </div>

        {/* Bonuses — chỉ render cái đã bật */}
        {visibleBonusOptions.length > 0 && (
          <div>
            {visibleBonusOptions.map(({ key, label }) => (
              <div
                key={key}
                className="checkbox-row"
                onClick={(e) => e.stopPropagation()}
              >
                <label className="checkbox-item">
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
              </div>
            ))}
          </div>
        )}

        <div className="nav_bar">
          <button id="back_btn" type="button" onClick={() => navigate("/rule")}>
            Back
          </button>
          <button type="button">Pre</button>
          <button type="button">Next</button>
        </div>
      </div>
    </div>
  );
};

export default Score;
