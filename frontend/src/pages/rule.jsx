import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

const options = [
  "Handicap",
  "Reach Declaration",
  "Birdie Bonus",
  "Near Pin Bonus",
  "Draw Carryover",
  "Eagle Bonus",
  "Albatross Bonus",
  "Hole-in-One Bonus",
];

function Rule() {
  const navigate = useNavigate();

  // Khởi tạo state
  const [course, setCourse] = useState("");
  const [date, setDate] = useState("");
  const [players, setPlayers] = useState([]);
  const [frontname, setFrontName] = useState("前半");
  const [backname, setBackName] = useState("後半");
  const [rules, setRules] = useState(
    options.reduce((acc, opt) => ({ ...acc, [opt]: false }), {})
  );
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Lấy dữ liệu game setup từ localStorage khi trang Rule được tải
    const savedSetup = JSON.parse(localStorage.getItem("gameSetup"));
    if (savedSetup) {
      setCourse(savedSetup.course || "");
      setDate(savedSetup.date || "");
      setPlayers(savedSetup.players || []);
      setFrontName(savedSetup.frontname || "前半");
      setBackName(savedSetup.backname || "後半");
      setRules(savedSetup.rules || {});
    }
  }, []);

  const toggleRule = (rule) => {
    setRules((prev) => ({ ...prev, [rule]: !prev[rule] }));
  };

  const validate = () => {
    const errs = {};
    if (!frontname.trim()) errs.frontname = "※前半名を入力してください。"; // Front 9
    if (!backname.trim()) errs.backname = "※後半名を入力してください。"; // Back 9
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
    };

    console.log("Rule Settings:", payload);

    // Lưu vào localStorage các thay đổi
    localStorage.setItem("gameSetup", JSON.stringify(payload));

    navigate("/score");
  };

  return (
    <div className="container">
      <h2 className="title">Golf Score Calculator</h2>
      <p className="subtitle">A simple way to track your game points.</p>

      <form className="form_container" onSubmit={handleSubmit} noValidate>
        <h3>Rule Settings</h3>

        <p className="note">
          Course: <b>{course || "-"}</b> | Date: <b>{date || "-"}</b>
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
            <div key={rule} className="rule_item">
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
          ))}
        </div>

        <div className="nav_bar">
          <button id="back_btn" type="button" onClick={() => navigate("/")}>
            Back
          </button>
          <button type="submit" disabled={false}>
            Start Scoring
          </button>
        </div>
      </form>
    </div>
  );
}

export default Rule;
