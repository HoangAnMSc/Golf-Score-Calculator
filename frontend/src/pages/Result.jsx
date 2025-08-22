import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

function safeJSONParse(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function Result() {
  const navigate = useNavigate();
  const containerRef = useRef(null);

  // ===== Landscape toggle (inline CSS) =====
  const [isLandscape, setIsLandscape] = useState(false);
  const resizeHandlerRef = useRef(null);

  function applyLandscapeCSS() {
    const el = containerRef.current;
    if (!el) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    document.body.classList.add("landscape-lock");

    el.style.position = "fixed";
    el.style.top = "0";
    el.style.left = "0";
    el.style.width = `${vh}px`;
    el.style.height = `${vw}px`;
    el.style.maxWidth = "none";
    el.style.transform = "rotate(90deg) translateY(-100%)";
    el.style.transformOrigin = "top left";
    el.style.background = "#f8f9fa";
    el.style.zIndex = "9999";
    el.style.overflow = "auto";
  }

  function clearLandscapeCSS() {
    const el = containerRef.current;
    if (!el) return;
    document.body.classList.remove("landscape-lock");

    el.style.position = "";
    el.style.top = "";
    el.style.left = "";
    el.style.width = "";
    el.style.height = "";
    el.style.maxWidth = "";
    el.style.transform = "";
    el.style.transformOrigin = "";
    el.style.background = "";
    el.style.zIndex = "";
    el.style.overflow = "";
  }

  const handleToggleLandscape = () => {
    if (!isLandscape) {
      setIsLandscape(true);
      applyLandscapeCSS();
      const onResize = () => applyLandscapeCSS();
      window.addEventListener("resize", onResize);
      resizeHandlerRef.current = onResize;
    } else {
      setIsLandscape(false);
      if (resizeHandlerRef.current) {
        window.removeEventListener("resize", resizeHandlerRef.current);
        resizeHandlerRef.current = null;
      }
      clearLandscapeCSS();
    }
  };

  useEffect(() => {
    return () => {
      if (resizeHandlerRef.current) {
        window.removeEventListener("resize", resizeHandlerRef.current);
        resizeHandlerRef.current = null;
      }
      clearLandscapeCSS();
    };
  }, []);

  // ===== Data =====
  const setup = safeJSONParse("gameSetup", {
    course: "",
    date: "",
    players: [],
    frontname: "前半",
    backname: "後半",
    rules: {},
  });

  const allHolesData = safeJSONParse("allHolesData", {});
  const holes = Array.from({ length: 18 }, (_, i) => i + 1);

  const firstHoleScoresLen = (() => {
    const h1 = Array.isArray(allHolesData)
      ? allHolesData[0]
      : allHolesData["1"] || allHolesData[1];
    return h1?.scores?.length ?? 0;
    // eslint-disable-next-line
  })();

  const players =
    (Array.isArray(setup.players) && setup.players.length > 0
      ? setup.players
      : ["P1", "P2", "P3", "P4"].slice(0, firstHoleScoresLen || 4)) || [];

  const getHoleObj = (h) => {
    if (Array.isArray(allHolesData)) return allHolesData[h - 1] || {};
    return allHolesData[String(h)] || allHolesData[h] || {};
  };

  const parByHole = holes.map((h) => Number(getHoleObj(h)?.par ?? 0));
  const parFront = parByHole
    .slice(0, 9)
    .reduce((a, b) => a + (Number(b) || 0), 0);
  const parBack = parByHole
    .slice(9, 18)
    .reduce((a, b) => a + (Number(b) || 0), 0);
  const parTotal = parFront + parBack;

  // ===== Export JSON =====
  const handleExport = () => {
    const scoresPayload = players.map((name, pIdx) => {
      const perHole = holes.map((h) => {
        const ho = getHoleObj(h);
        const s = ho?.scores?.[pIdx] || {};
        const pre = typeof s.pre_score === "number" ? s.pre_score : 0;
        return {
          pre_score: pre,
          reach: !!s.reach,
          nearPin: !!s.nearPin,
        };
      });

      const frontSum = perHole
        .slice(0, 9)
        .reduce((a, b) => a + (b.pre_score || 0), 0);
      const backSum = perHole
        .slice(9, 18)
        .reduce((a, b) => a + (b.pre_score || 0), 0);
      const total = frontSum + backSum;

      return { player: name, perHole, frontSum, backSum, total };
    });

    const payload = {
      meta: {
        exportedAt: new Date().toISOString(),
        course: setup.course || "",
        date: setup.date || "",
        frontname: setup.frontname || "前半",
        backname: setup.backname || "後半",
        rules: setup.rules || {},
      },
      holes: 18,
      par: parByHole,
      parTotals: { front: parFront, back: parBack, total: parTotal },
      players,
      scores: scoresPayload,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    a.href = url;
    a.download = `scorecard_${(setup.course || "course").replace(
      /\s+/g,
      "_"
    )}_${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // ===== Helpers render =====
  const getCell = (holeIndex, playerIndex) => {
    const h = holeIndex + 1;
    const s = getHoleObj(h)?.scores?.[playerIndex] ?? {};
    const score_val = typeof s.score === "number" ? s.score : "";
    const pre_val = typeof s.pre_score === "number" ? s.pre_score : "";
    return {
      score: score_val,
      pre_score: pre_val,
      reach: !!s.reach,
      nearPin: !!s.nearPin,
    };
  };

  const sumGross = (playerIndex, startHole, endHole) => {
    let sum = 0;
    for (let h = startHole; h <= endHole; h++) {
      const v = getHoleObj(h)?.scores?.[playerIndex]?.score;
      if (typeof v === "number" && !Number.isNaN(v)) sum += v;
    }
    return sum || 0;
  };

  const sumScore = (playerIndex, startHole, endHole) => {
    let sum = 0;
    for (let h = startHole; h <= endHole; h++) {
      const v = getHoleObj(h)?.scores?.[playerIndex]?.pre_score;
      if (typeof v === "number" && !Number.isNaN(v)) sum += v;
    }
    return sum || 0;
  };

  return (
    <div ref={containerRef} className="container">
      <h2 className="title">Score Calculator</h2>
      <p className="subtitle">A simple way to track your game points.</p>

      <div className="form_container">
        {/* Header */}
        <div className="scorecard-header">
          <div className="scorecard-title">
            <div className="title">スコアカード</div>
            <p className="note">
              <span>Course : {setup.course || "Course"}</span>
              <span style={{ margin: "0 8px" }}>|</span>
              <span>Date : {setup.date || ""}</span>
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="scorecard-wrapper">
          <table className="scorecard">
            <thead>
              <tr className="holes-row">
                <th style={{ width: 80 }}>ホール</th>

                {/* NEW:種別*/}
                <th className="type-col">種別</th>

                {holes.slice(0, 9).map((h) => (
                  <th key={`h-out-${h}`}>{h}</th>
                ))}
                <th className="section-sum">{setup.frontname || "前半"}</th>
                {holes.slice(9, 18).map((h) => (
                  <th key={`h-in-${h}`}>{h}</th>
                ))}
                <th className="section-sum">{setup.backname || "後半"}</th>
                <th className="grand-sum">合計</th>
              </tr>

              <tr className="par-row">
                <th>Par</th>
                <th></th>

                {parByHole.slice(0, 9).map((p, i) => (
                  <td key={`par-out-${i}`}>{p}</td>
                ))}
                <td className="section-sum">
                  {parByHole
                    .slice(0, 9)
                    .reduce((a, b) => a + (Number(b) || 0), 0)}
                </td>
                {parByHole.slice(9, 18).map((p, i) => (
                  <td key={`par-in-${i}`}>{p}</td>
                ))}
                <td className="section-sum">
                  {parByHole
                    .slice(9, 18)
                    .reduce((a, b) => a + (Number(b) || 0), 0)}
                </td>
                <td className="grand-sum">
                  {parByHole.reduce((a, b) => a + (Number(b) || 0), 0)}
                </td>
              </tr>
            </thead>

            <tbody>
              {players.map((name, pIdx) => {
                const frontScore = sumScore(pIdx, 1, 9);
                const frontGross = sumGross(pIdx, 1, 9);
                const backScore = sumScore(pIdx, 10, 18);
                const backGross = sumGross(pIdx, 10, 18);
                const grossTotal = frontGross + backGross;
                const scoreTotal = frontScore + backScore;

                return (
                  <tr key={`player-${pIdx}`} className="player-row">
                    {/* Tên player */}
                    <th className="player-name">{name}</th>

                    {/* Gross/Score*/}
                    <td className="type-col">
                      <div className="type-line">スコア</div>
                      <hr />
                      <div className="type-line">ポイント</div>
                    </td>

                    {/* OUT holes */}
                    {holes.slice(0, 9).map((_, i) => {
                      const { score, pre_score, reach, nearPin } = getCell(
                        i,
                        pIdx
                      );
                      return (
                        <td key={`p${pIdx}-out-${i}`} className="score-cell">
                          <div className="cell-inner">
                            <span className="score-val">{score}</span>
                          </div>
                          <hr />
                          <div className="cell-inner">
                            {reach && <span className="mark-reach">△</span>}
                            {nearPin && <span className="mark-nearpin">●</span>}
                            <span className="score-val">{pre_score}</span>
                          </div>
                        </td>
                      );
                    })}

                    {/* 前半合計 */}
                    <td className="section-sum">
                      {frontGross}
                      <hr />
                      {frontScore}
                    </td>

                    {/* IN holes */}
                    {holes.slice(9, 18).map((_, i) => {
                      const holeIdx = 9 + i;
                      const { score, pre_score, reach, nearPin } = getCell(
                        holeIdx,
                        pIdx
                      );
                      return (
                        <td key={`p${pIdx}-in-${i}`} className="score-cell">
                          <div className="cell-inner">
                            <span className="score-val">{score}</span>
                          </div>
                          <hr />
                          <div className="cell-inner">
                            {reach && <span className="mark-reach">△</span>}
                            {nearPin && <span className="mark-nearpin">●</span>}
                            <span className="score-val">{pre_score}</span>
                          </div>
                        </td>
                      );
                    })}

                    {/* 後半合計 */}
                    <td className="section-sum">
                      {backGross}
                      <hr />
                      {backScore}
                    </td>

                    {/* 合計 */}
                    <td className="grand-sum">
                      {grossTotal}
                      <hr />
                      {scoreTotal}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {(setup?.rules?.["Reach Declaration"] ||
          setup?.rules?.["Near Pin Bonus"]) && (
          <div className="legend">
            {setup?.rules?.["Reach Declaration"] && (
              <span className="legend-item">
                <span className="mark-reach">△</span> Reach
              </span>
            )}
            {setup?.rules?.["Near Pin Bonus"] && (
              <span className="legend-item">
                <span className="mark-nearpin">●</span> Near Pin
              </span>
            )}
          </div>
        )}

        <div className="nav_bar" style={!isLandscape ? { marginTop: 200 } : {}}>
          <button
            id="back_btn"
            type="button"
            onClick={() => navigate("/score")}
          >
            Back
          </button>
          <button type="button" onClick={handleExport}>
            Export File
          </button>
          <button type="button" onClick={handleToggleLandscape}>
            {isLandscape ? "縦向" : "横向"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Result;
