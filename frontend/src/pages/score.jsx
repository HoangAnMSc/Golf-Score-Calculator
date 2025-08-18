import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../App.css";

const Score = () => {
  const navigate = useNavigate();
  const { state } = useLocation() || {};
  const [hole, setHole] = useState(() => {
    const savedHole = localStorage.getItem("hole");
    return savedHole ? JSON.parse(savedHole) : 1;
  });

  const [activePlayerIdx, setActivePlayerIdx] = useState(() => {
    const savedIdx = localStorage.getItem("activePlayerIdx");
    return savedIdx ? JSON.parse(savedIdx) : 0;
  });

  const players = state?.players ||
    JSON.parse(localStorage.getItem("gameSetup"))?.players || [
      "P1",
      "P2",
      "P3",
      "P4",
    ];

  const courseName =
    state?.course ||
    JSON.parse(localStorage.getItem("gameSetup"))?.course ||
    "My Course";

  const frontName =
    hole >= 10 ? state?.backname || "後半" : state?.frontname || "前半";

  const rulesFromRule =
    state?.rules ||
    JSON.parse(localStorage.getItem("gameSetup"))?.rules ||
    null;

  const ruleKeyMap = {
    "Reach Declaration": "reach",
    "Near Pin Bonus": "nearPin",
  };

  const enabledBonusKeys = rulesFromRule
    ? new Set(
        Object.entries(rulesFromRule)
          .filter(([name, on]) => on === true)
          .map(([name]) => ruleKeyMap[name])
          .filter(Boolean)
      )
    : null;

  const [par, setPar] = useState(4);
  const [scores, setScores] = useState(() => {
    const savedHoleData =
      JSON.parse(localStorage.getItem("allHolesData")) || {};
    const previousHoleData = savedHoleData[hole - 1] || { scores: [] };

    return players.map((_, idx) => {
      const previousScore = previousHoleData.scores[idx] || {
        score: 0,
        total_score: 0,
      };
      return {
        score: 0,
        pre_score: 0,
        total_score: previousScore.total_score + previousScore.pre_score || 0,
        reach: false,
        nearPin: false,
        teamColor: "red",
      };
    });
  });

  const [selectedField, setSelectedField] = useState("score");
  const [errorMessage, setErrorMessage] = useState("");
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    localStorage.setItem("hole", JSON.stringify(hole));
  }, [hole]);

  useEffect(() => {
    localStorage.setItem("activePlayerIdx", JSON.stringify(activePlayerIdx));
  }, [activePlayerIdx]);

  useEffect(() => {
    const savedSetup = JSON.parse(localStorage.getItem("gameSetup"));
    if (savedSetup) {
      setScores(savedSetup.scores || scores);
      setPar(savedSetup.par || 4);
    }

    const savedHoleData = JSON.parse(localStorage.getItem("allHolesData"));
    if (savedHoleData && savedHoleData[hole]) {
      const holeData = savedHoleData[hole];
      setPar(holeData.par);
      const s = holeData.scores || [];
      setScores(withCalcIfReady(s));
    }
  }, []);

  //NUMPADのロジック
  const [inputBuffers, setInputBuffers] = useState(() => players.map(() => ""));

  const handleNumberClick = (num) => {
    const digit = String(num);
    setInputBuffers((prev) => {
      const nextBufs = [...prev];
      const newBuf = (nextBufs[activePlayerIdx] + digit).slice(-2);
      nextBufs[activePlayerIdx] = newBuf;

      setScores((prevScores) => {
        const next = prevScores.map((x, i) =>
          i === activePlayerIdx
            ? { ...x, score: newBuf ? Number(newBuf) : 0 }
            : x
        );
        return withCalcIfReady(next);
      });

      return nextBufs;
    });
  };

  // NearPinのロジック
  const setExclusiveNearPin = (targetIdx, checked) => {
    setScores((prev) => {
      const toggled = prev.map((p, i) => ({
        ...p,
        nearPin: i === targetIdx ? checked : false,
      }));
      return withCalcIfReady(toggled);
    });
  };

  //ReachとNearPinの非表示
  const bonusOptions = [
    { key: "reach", label: "Reach" },
    { key: "nearPin", label: "Near Pin" },
  ];

  const visibleBonusOptions = enabledBonusKeys
    ? bonusOptions.filter((opt) => enabledBonusKeys.has(opt.key))
    : bonusOptions;

  //出フィレ
  const handleExport = () => {
    navigate("/result");
  };

  //Merge変更データ
  const saveHoleDataDiff = (h, parVal, scoresArr) => {
    const allHolesData = JSON.parse(localStorage.getItem("allHolesData")) || {};
    const existing = allHolesData[h] || { hole: h, par: parVal, scores: [] };

    const nextPar = parVal !== existing.par ? parVal : existing.par;

    const mergedScores = scoresArr.map((curr, i) => {
      const prev = existing.scores?.[i] || {};
      const merged = { ...prev };
      Object.keys(curr).forEach((k) => {
        if (curr[k] !== prev[k]) merged[k] = curr[k];
      });
      return merged;
    });

    allHolesData[h] = {
      ...existing,
      hole: h,
      par: nextPar,
      scores: mergedScores,
    };
    localStorage.setItem("allHolesData", JSON.stringify(allHolesData));
  };

  const readyForCalc = (arr) => {
    const allScored = arr.every((p) => Number(p.score) > 0);
    const red = arr.filter((p) => p.teamColor === "red").length;
    const blue = arr.filter((p) => p.teamColor === "blue").length;
    return allScored && red === 2 && blue === 2;
  };

  const withCalcIfReady = (next) => {
    return readyForCalc(next)
      ? recalcPreScoresForHole(next)
      : next.map((p) => ({ ...p, pre_score: 0 }));
  };

  //ゴルフ点数計算のロジック
  const recalcPreScoresForHole = (arr) => {
    const s = arr.map((v) => ({ ...v }));
    const raw = s.map((v) => Number(v.score || 0));

    // Team
    const redIdx = s
      .map((p, i) => (p.teamColor === "red" ? i : -1))
      .filter((i) => i >= 0);
    const blueIdx = s
      .map((p, i) => (p.teamColor === "blue" ? i : -1))
      .filter((i) => i >= 0);

    // parent/child
    const [parentRed, childRed] =
      redIdx.length === 2
        ? raw[redIdx[0]] <= raw[redIdx[1]]
          ? [redIdx[0], redIdx[1]]
          : [redIdx[1], redIdx[0]]
        : [null, null];

    const [parentBlue, childBlue] =
      blueIdx.length === 2
        ? raw[blueIdx[0]] <= raw[blueIdx[1]]
          ? [blueIdx[0], blueIdx[1]]
          : [blueIdx[1], blueIdx[0]]
        : [null, null];

    let redPts = 0,
      bluePts = 0;

    if (parentRed != null && parentBlue != null) {
      // Parent logic
      if (raw[parentRed] < raw[parentBlue]) {
        redPts += Math.max(2, raw[parentBlue] - raw[parentRed]);
        bluePts += -redPts;
      } else if (raw[parentRed] > raw[parentBlue]) {
        bluePts += Math.max(2, raw[parentRed] - raw[parentBlue]);
        redPts += -bluePts;
      }

      // Child logic
      if (raw[childRed] < raw[childBlue]) {
        redPts += 1;
        bluePts -= 1;
      } else if (raw[childRed] > raw[childBlue]) {
        bluePts += 1;
        redPts -= 1;
      }
    }

    // NearPin bonus TEAM
    const redHasNearPin = redIdx.some((i) => !!s[i].nearPin);
    const blueHasNearPin = blueIdx.some((i) => !!s[i].nearPin);
    if (redHasNearPin) {
      redPts += 1;
      bluePts -= 1;
    }

    if (blueHasNearPin) {
      bluePts += 1;
      redPts -= 1;
    }

    // map pre_score for each player
    return s.map((v, i) => ({
      ...v,
      pre_score: v.teamColor === "red" ? redPts : bluePts,
    }));
  };

  //Nextブータン
  const handleNextHole = () => {
    const allScoresEntered = scores.every((score) => score.score !== 0);

    const redTeamCount = scores.filter(
      (score) => score.teamColor === "red"
    ).length;
    const blueTeamCount = scores.filter(
      (score) => score.teamColor === "blue"
    ).length;

    if (!allScoresEntered) {
      setErrorMessage("すべてのプレイヤーがスコアを入力してください。");
      setShowError(true);
      return;
    } else if (redTeamCount !== 2 || blueTeamCount !== 2) {
      setErrorMessage("各チームに2人のプレイヤーを入力してください。");
      setShowError(true);
      return;
    } else {
      setErrorMessage("");
      setShowError(false);
    }

    // Save hole rightnow
    saveHoleDataDiff(hole, par, scores);

    // Hole 18 => Result
    if (hole === 18) {
      navigate("/result");
      return;
    }

    // Update total_score
    const allHolesData = JSON.parse(localStorage.getItem("allHolesData")) || {};
    const currentHoleData = allHolesData[hole];
    const nextHole = hole + 1;

    if (currentHoleData?.scores) {
      const prevTotals = currentHoleData.scores.map(
        (s) => Number(s.total_score || 0) + Number(s.pre_score || 0)
      );

      if (allHolesData[nextHole]?.scores) {
        // Có dữ liệu hole sau -> chỉ update nếu total_score khác
        const updatedScores = allHolesData[nextHole].scores.map((s, idx) => {
          if (s.total_score !== prevTotals[idx]) {
            return { ...s, total_score: prevTotals[idx] };
          }
          return s;
        });
        allHolesData[nextHole] = {
          ...allHolesData[nextHole],
          scores: updatedScores,
        };
        localStorage.setItem("allHolesData", JSON.stringify(allHolesData));
      }
    }

    //Next Hole Logic
    setHole(nextHole);

    if (!allHolesData[nextHole]?.scores) {
      const totals = currentHoleData?.scores
        ? currentHoleData.scores.map(
            (s) => Number(s.total_score || 0) + Number(s.pre_score || 0)
          )
        : [];
      setScores(
        players.map((_, idx) => ({
          score: 0,
          pre_score: 0,
          total_score: totals[idx] || 0,
          reach: false,
          nearPin: false,
          teamColor: "red",
        }))
      );
      setInputBuffers(players.map(() => ""));
    } else {
      setScores(allHolesData[nextHole].scores);
    }
  };

  //Preブータン
  const handlePreHole = () => {
    const prevHole = hole > 1 ? hole - 1 : 1;
    setHole(prevHole);

    const allHolesData = JSON.parse(localStorage.getItem("allHolesData")) || {};
    const prevHoleData = allHolesData[prevHole];
    if (prevHoleData) {
      setPar(prevHoleData.par || 4);
      setScores(prevHoleData.scores || scores);
    }
  };

  //エーラOK＿ENTER
  const handleCloseError = () => {
    setShowError(false);
  };

  return (
    <div className="container">
      <h2 className="title">Score Calculator</h2>
      <p className="subtitle">A simple way to track your game points.</p>

      <div className="form_container">
        {showError && (
          <div className="error-modal">
            <div className="error-modal-content">
              <p>{errorMessage}</p>
              <button onClick={handleCloseError}>OK</button>
            </div>
          </div>
        )}

        <h3 className="course_title">{courseName}'s Course</h3>

        <div className="hole-wapper">
          <button type="button" className="total_result" onClick={handleExport}>
            Result
          </button>
          <div className="hole-content">
            <span>{frontName}</span>
            <span>H{hole}</span>
          </div>
          <div>
            Par
            <div className="counter-box">
              <button
                type="button"
                className="circle-btn"
                onClick={() => setPar((p) => Math.max(3, p - 1))}
              >
                -
              </button>
              <div className="counter-value">{par}</div>
              <button
                type="button"
                className="circle-btn"
                onClick={() => setPar((p) => Math.min(5, p + 1))}
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
                  <div className="total_score">{scores[idx].total_score}</div>
                  <div className="pre_score">
                    {scores[idx].total_score}(
                    {scores[idx].pre_score >= 0 ? "+" : ""}
                    {scores[idx].pre_score})
                  </div>

                  {/* Near Pin label */}
                  {scores[idx].nearPin && <div className="pin-label">ニピ</div>}

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

            <div
              className={`par-label ${par === 5 ? "par-below" : ""}`}
              style={
                par === 3 ? { left: `73.5%` } : par === 4 ? { left: `94%` } : {}
              }
            >
              パー
            </div>
          </div>
        </div>

        <div className="team-item" onClick={(e) => e.stopPropagation()}>
          <span className="team-label-red">Red</span>
          <label className="team-switch">
            <input
              type="checkbox"
              checked={scores[activePlayerIdx].teamColor === "blue"}
              onChange={(e) => {
                setScores((prev) => {
                  const next = prev.map((p, i) =>
                    i === activePlayerIdx
                      ? { ...p, teamColor: e.target.checked ? "blue" : "red" }
                      : p
                  );
                  return withCalcIfReady(next);
                });
              }}
              onClick={(e) => e.stopPropagation()}
            />
            <span className="team-slider"></span>
          </label>
          <span className="team-label-blue">Blue</span>
        </div>

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
                    onChange={(e) => {
                      if (key === "nearPin") {
                        setExclusiveNearPin(activePlayerIdx, e.target.checked);
                      } else {
                        setScores((prev) => {
                          const next = [...prev];
                          next[activePlayerIdx][key] = e.target.checked;
                          return next;
                        });
                      }
                    }}
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
          <button type="button" onClick={handlePreHole}>
            Pre
          </button>
          <button type="button" onClick={handleNextHole}>
            {hole === 18 ? "Finish" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Score;
