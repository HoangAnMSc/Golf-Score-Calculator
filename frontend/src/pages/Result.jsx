import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

function Result() {
  const navigate = useNavigate();

  return (
    <div className="container">
      <h2 className="title">Score Calculator</h2>
      <p className="subtitle">A simple way to track your game points.</p>

      <div className="nav_bar">
        <button id="back_btn" type="button" onClick={() => navigate("/score")}>
          Back
        </button>
      </div>
    </div>
  );
}

export default Result;
