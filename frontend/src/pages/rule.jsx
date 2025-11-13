import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

const options = [
  "Handicap",
  "Reach Declaration",
  "Birdie Bonus",
  "Near Pin Bonus",
  "Custom Box",
  "Eagle Bonus",
  "Albatross Bonus",
  "Hole-in-One Bonus",
];

function Rule() {
  const navigate = useNavigate();

  const [course, setCourse] = useState("");
  const [date, setDate] = useState("");
  const [players, setPlayers] = useState([]);
  const [frontname, setFrontName] = useState("前半");
  const [backname, setBackName] = useState("後半");
  const [rules, setRules] = useState(
    options.reduce((acc, opt) => ({ ...acc, [opt]: false }), {})
  );
  const [reachValue, setReachValue] = useState(3);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const savedSetup = JSON.parse(localStorage.getItem("gameSetup"));
    if (savedSetup) {
      setCourse(savedSetup.course || "");
      setDate(savedSetup.date || "");
      setPlayers(savedSetup.players || []);
      setFrontName(savedSetup.frontname || "前半");
      setBackName(savedSetup.backname || "後半");
      setRules(savedSetup.rules || {});
      if (savedSetup.reachValue) {
        setReachValue(savedSetup.reachValue);
      }
    }
  }, []);

  const toggleRule = (rule) => {
    setRules((prev) => ({ ...prev, [rule]: !prev[rule] }));
  };

  const validate = () => {
    const errs = {};
    if (!frontname.trim()) errs.frontname = "※前半名を入力してください。";
    if (!backname.trim()) errs.backname = "※後半名を入力してください。";
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});

    const payload = {
      course,
      date,
      players,
      frontname: frontname.trim(),
      backname: backname.trim(),
      rules,
      reachValue: rules["Reach Declaration"] ? reachValue : null,
    };

    localStorage.setItem("gameSetup", JSON.stringify(payload));
    navigate("/score");
  };

  return (
    <div className="container">
      <h2 className="title">Score Calculator</h2>
      <p className="subtitle">A simple way to track your game points.</p>

      <form className="form_container" onSubmit={handleSubmit} noValidate>
        <h3>Rule Settings</h3>

        {/* AN - 1112 -Edit note */}
        <p className="note">
          Course: <b className="note_course">{course || "-"}</b> | Date:{" "}
          <b>{date || "-"}</b>
        </p>

        <div className="box_container">
          <div>
            <label>Front 9 Name</label>
            <input
              type="text"
              value={frontname || ""}
              placeholder="Front 9"
              onChange={(e) => setFrontName(e.target.value)}
            />
            {errors.frontname && (
              <p className="error-text">{errors.frontname}</p>
            )}
          </div>
          <div>
            <label>Back 9 Name</label>
            <input
              type="text"
              value={backname || ""}
              placeholder="Back 9"
              onChange={(e) => setBackName(e.target.value)}
            />
            {errors.backname && <p className="error-text">{errors.backname}</p>}
          </div>
        </div>

        <div className="rule_container">
          {options.map((rule) => (
            <div
              key={rule}
              className="rule_item"
              style={{ flexDirection: "column", alignItems: "flex-start" }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  width: "100%",
                }}
              >
                <span>{rule}</span>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={rules[rule]}
                    onChange={() => toggleRule(rule)}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              {rule === "Reach Declaration" && rules["Reach Declaration"] && (
                <div className="reach-slider-container">
                  <div className="slider-wrapper">
                    <input
                      type="range"
                      min={3}
                      max={16}
                      step={1}
                      value={reachValue}
                      onChange={(e) => setReachValue(Number(e.target.value))}
                      className="reach-slider"
                    />
                    <span
                      className="reach-value"
                      style={{
                        left: `${3 + ((reachValue - 3) / 13) * 95}%`,
                      }}
                    >
                      Max:{reachValue}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="nav_bar">
          <button id="back_btn" type="button" onClick={() => navigate("/")}>
            Back
          </button>
          <button type="submit">Start Scoring</button>
        </div>
      </form>
    </div>
  );
}

export default Rule;
