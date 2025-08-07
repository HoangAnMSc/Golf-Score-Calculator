import React, { useEffect, useState } from "react";
import axios from "axios";
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
  const [frontname, setFrontName] = useState("Front 9");
  const [nextname, setNextName] = useState("Next 9");
  const [rules, setRules] = useState(
    options.reduce((acc, opt) => ({ ...acc, [opt]: false }), {})
  );
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const toggleRule = (rule) => {
    setRules((prev) => ({
      ...prev,
      [rule]: !prev[rule],
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const data = {
      frontname,
      nextname,
      rules,
    };

    console.log("Start Scoring:", data);
  };

  return (
    <div className="container">
      <h2 className="title">Golf Score Calculator</h2>
      <p className="subtitle">A simple way to track your game points.</p>

      <form className="form_container" onSubmit={handleSubmit}>
        <h3>Rule Settings</h3>

        <div className="box_container">
          <div>
            <label>Front 9 Name</label>
            <input
              type="text"
              value={frontname}
              onChange={(e) => setFrontName(e.target.value)}
            />
          </div>
          <div>
            <label>Next 9 Name</label>
            <input
              type="text"
              value={nextname}
              onChange={(e) => setNextName(e.target.value)}
            />
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

        <button type="submit">Start Scoring</button>
      </form>
    </div>
  );
}

export default Rule;
