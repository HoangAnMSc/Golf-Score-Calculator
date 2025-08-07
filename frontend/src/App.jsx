import React, { useState } from "react";
import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/home";
import Rule from "./pages/rule";
import Score from "./pages/score";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/rule" element={<Rule />} />
        <Route path="/score" element={<Score />} />
      </Routes>
    </Router>
  );
}

export default App;
