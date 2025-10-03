import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Select from "react-select";
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
    "Birdie Bonus": "birdie",
    "Reach Declaration": "reach",
    "Near Pin Bonus": "nearPin",
    "Custom Box": "custom",
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
        gross_score: 0,
        total_score: 0,
      };
      return {
        score: 0,
        pre_score: 0,
        gross_score: previousScore.gross_score + previousScore.score || 0,
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
  const [drawBonus, setDrawBonus] = useState(() => {
    const savedDrawBonus = localStorage.getItem("drawBonus");
    return savedDrawBonus ? JSON.parse(savedDrawBonus) : 0;
  });

  useEffect(() => {
    localStorage.setItem("drawBonus", JSON.stringify(drawBonus));
  }, [drawBonus]);

  useEffect(() => {
    if (drawBonus > 0) {
      setScores((prev) => {
        const next = prev.map((p) => ({
          ...p,
          custom: true,
          customValue: drawBonus,
        }));
        return withCalcIfReady(next);
      });
    }
  }, [drawBonus]);

  const [reachValue, setReachValue] = useState(() => {
    try {
      const setup = JSON.parse(localStorage.getItem("gameSetup") || "{}");
      return Number(setup?.reachValue ?? 0) || 0;
    } catch {
      return 0;
    }
  });
  const [showHolePicker, setShowHolePicker] = useState(false);

  //Load Hole
  useEffect(() => {
    localStorage.setItem("hole", JSON.stringify(hole));
  }, [hole]);

  //Load Tab_Ative
  useEffect(() => {
    localStorage.setItem("activePlayerIdx", JSON.stringify(activePlayerIdx));
  }, [activePlayerIdx]);

  //Load Data
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

  //Clear checked on par = 3
  useEffect(() => {
    if (par !== 3) {
      setScores((prev) => {
        const cleared = prev.map((p) => ({ ...p, nearPin: false }));
        return withCalcIfReady(cleared);
      });
    } else {
      setScores((prev) => withCalcIfReady(prev));
    }
  }, [par]);

  //Update when have new storage
  useEffect(() => {
    const onStorage = () => {
      try {
        const setup = JSON.parse(localStorage.getItem("gameSetup") || "{}");
        const v = Number(setup?.reachValue ?? 0) || 0;
        setReachValue(v);
      } catch {}
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  //Update logic when had new storage
  useEffect(() => {
    recomputeAllHoles();
  }, [reachValue]);

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
            ? {
                ...x,
                score: newBuf
                  ? Number(newBuf) < 20
                    ? Number(newBuf)
                    : Number(newBuf.slice(-1))
                  : 0,
              }
            : x
        );
        return withCalcIfReady(next);
      });

      return nextBufs;
    });
  };

  // NearPinのロジック
  const setExclusiveNearPin = (targetIdx, checked) => {
    if (par !== 3) return;

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
    { key: "custom", label: "Custom Box" },
  ];

  const visibleBonusOptions = enabledBonusKeys
    ? bonusOptions.filter((opt) => enabledBonusKeys.has(opt.key))
    : bonusOptions;

  //Result Link
  const handleExport = () => {
    navigate("/result");
  };

  //Merge変更データ
  const saveHoleDataDiff = (h, parVal, scoresArr) => {
    const allHolesData = JSON.parse(localStorage.getItem("allHolesData")) || {};
    const existing = allHolesData[h] || {
      hole: h,
      par: parVal,
      scores: [],
    };

    // re-calc pre_score
    const recomputed = withCalcIfReady(scoresArr);

    const mergedScores = recomputed.map((curr, i) => {
      const prev = existing.scores?.[i] || {};
      const out = { ...prev };

      [
        "score",
        "teamColor",
        "nearPin",
        "reach",
        "custom",
        "customValue",
        "gross_score",
        "total_score",
      ].forEach((k) => {
        if (curr[k] !== prev[k]) out[k] = curr[k];
      });

      // pre_scoreは最新
      out.pre_score = curr.pre_score;

      return out;
    });

    allHolesData[h] = {
      ...existing,
      hole: h,
      par: parVal !== existing.par ? parVal : existing.par,
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
  const recalcPreScoresForHole = (arr, parVal = par) => {
    const s = arr.map((v) => ({ ...v }));
    const raw = s.map((v) => Number(v.score || 0));

    // Handle Team
    const redIdx = s
      .map((p, i) => (p.teamColor === "red" ? i : -1))
      .filter((i) => i >= 0);
    const blueIdx = s
      .map((p, i) => (p.teamColor === "blue" ? i : -1))
      .filter((i) => i >= 0);

    // Parent/Child
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
      //Birdie Logic
      if (enabledBonusKeys?.has("birdie")) {
        let birdieCount = 0;

        if (raw[parentRed] < raw[childBlue]) {
          // Red win
          redPts += raw[childBlue] - raw[parentRed];
          bluePts = -redPts;

          if (raw[parentRed] < parVal) birdieCount++;

          if (raw[childRed] < raw[parentBlue]) {
            redPts += 1;
            bluePts -= 1;
            if (raw[childRed] < parVal) birdieCount++;
          }
        } else if (raw[parentRed] > raw[childBlue]) {
          // Blue win
          bluePts += raw[parentRed] - raw[childBlue];
          redPts = -bluePts;

          if (raw[childBlue] < parVal) birdieCount++;

          if (raw[childRed] > raw[parentBlue]) {
            bluePts += 1;
            redPts -= 1;
            if (raw[parentBlue] < parVal) birdieCount++;
          }
        }
        const factor = birdieCount > 0 ? birdieCount : 1;
        redPts = (redPts + factor) * factor;
        bluePts = (bluePts - factor) * factor;
      } else {
        //Normal Logic
        if (raw[parentRed] < raw[parentBlue]) {
          //parentRed Win
          redPts += raw[parentBlue] - raw[parentRed];
          bluePts -= redPts;
          if (raw[childRed] < raw[childBlue]) {
            redPts += 1;
            bluePts -= 1;
          }
        } else if (raw[parentRed] > raw[parentBlue]) {
          //parentBlue Win
          bluePts += raw[parentRed] - raw[parentBlue];
          redPts -= bluePts;
          if (raw[childRed] > raw[childBlue]) {
            bluePts += 1;
            redPts -= 1;
          }
        } else {
          //parent Draw
          if (raw[childRed] < raw[childBlue]) {
            redPts += 1;
            bluePts -= 1;
          } else if (raw[childRed] > raw[childBlue]) {
            bluePts += 1;
            redPts -= 1;
          }
        }
      }

      // NearPin team bonus
      if (parVal === 3 && s.some((p) => p.nearPin)) {
        if (redPts > 0) {
          redPts += 1;
          bluePts -= 1;
        } else if (bluePts > 0) {
          bluePts += 1;
          redPts -= 1;
        }
      }

      // Reach bonus team
      const reachCount = s.filter((p) => !!p.reach).length;
      if (reachCount > 0 && reachValue > 0) {
        const pow = Math.pow(2, Math.min(reachCount, 4)); // 2, 4, 8, 16
        const bonus = Math.min(reachValue, pow);
        // if (redPts > 0) {
        //   redPts += bonus;
        //   bluePts -= bonus;
        // } else if (bluePts > 0) {
        //   bluePts += bonus;
        //   redPts -= bonus;
        // }

        if (redPts > 0) {
          redPts = redPts * bonus;
          bluePts = bluePts * bonus;
        } else if (bluePts > 0) {
          bluePts = bluePts * bonus;
          redPts = redPts * bonus;
        }
      }

      // Custom Box team bonus
      const customValue = Math.max(
        ...s.map((p) => Number(p.customValue || 0)),
        0
      );

      if (s.some((p) => p.custom)) {
        if (redPts > 0) {
          redPts += customValue;
          bluePts -= customValue;
        } else if (bluePts > 0) {
          bluePts += customValue;
          redPts -= customValue;
        }
      }
    }

    return s.map((v) => ({
      ...v,
      pre_score: v.teamColor === "red" ? redPts : bluePts,
    }));
  };

  const recomputeAllHoles = () => {
    const all = JSON.parse(localStorage.getItem("allHolesData") || "{}");
    const setup = JSON.parse(localStorage.getItem("gameSetup") || "{}");

    const playerCount = players.length;
    const runningGross = Array(playerCount).fill(0);
    const runningTeam = Array(playerCount).fill(0);

    for (let h = 1; h <= 18; h++) {
      const key = String(h);
      const holeData = all[key] || { hole: h, par: 4, scores: [] };
      const parVal = Number(holeData.par || 4);

      // scores player
      const baseScores = Array.from({ length: playerCount }, (_, i) => {
        const prev = holeData.scores?.[i] || {};
        // nearPin par != 3
        const nearPin = parVal === 3 ? !!prev.nearPin : false;
        return {
          score: Number(prev.score || 0),
          teamColor: prev.teamColor || "red",
          reach: !!prev.reach,
          nearPin,
          custom: !!prev.custom,
          customValue: prev.customValue || 1,
          gross_score: runningGross[i],
          total_score: runningTeam[i],
          pre_score: 0,
        };
      });

      // pre_score  par & reachValue
      const withPre = recalcPreScoresForHole(baseScores, parVal);

      for (let i = 0; i < playerCount; i++) {
        runningGross[i] += Number(withPre[i].score || 0);
        runningTeam[i] += Number(withPre[i].pre_score || 0);
      }

      all[key] = { hole: h, par: parVal, scores: withPre };
    }

    localStorage.setItem("allHolesData", JSON.stringify(all));

    const current = all[String(hole)];
    if (current) {
      setPar(Number(current.par || 4));
      setScores(current.scores);
    }
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
    // Kiểm tra Draw
    const redTotal = scores
      .filter((s) => s.teamColor === "red")
      .reduce((sum, s) => sum + s.pre_score, 0);

    const blueTotal = scores
      .filter((s) => s.teamColor === "blue")
      .reduce((sum, s) => sum + s.pre_score, 0);

    const isDraw = redTotal === blueTotal;

    if (isDraw) {
      setDrawBonus((prev) => prev + 1);
    } else {
      setDrawBonus(0);
    }

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

      const prevGross = currentHoleData.scores.map(
        (s) => Number(s.gross_score || 0) + Number(s.score || 0)
      );

      if (allHolesData[nextHole]?.scores) {
        const updatedScores = allHolesData[nextHole].scores.map((s, idx) => {
          let updated = { ...s };

          if (s.total_score !== prevTotals[idx]) {
            updated.total_score = prevTotals[idx];
          }

          if (s.gross_score !== prevGross[idx]) {
            updated.gross_score = prevGross[idx];
          }

          return updated;
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
      const prevScores = currentHoleData?.scores || [];

      const carryTotals = prevScores.map(
        (s) => Number(s.total_score || 0) + Number(s.pre_score || 0)
      );
      const carryGross = prevScores.map(
        (s) => Number(s.gross_score || 0) + Number(s.score || 0)
      );

      setScores(
        players.map((_, idx) => ({
          score: 0,
          pre_score: 0,
          gross_score: carryGross[idx] || 0,
          total_score: carryTotals[idx] || 0,
          reach: false,
          custom: drawBonus > 0,
          customValue: drawBonus > 0 ? drawBonus : 0,
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
    if (drawBonus > 0) {
      setDrawBonus((prev) => prev - 1);
    }
    setHole(prevHole);

    const allHolesData = JSON.parse(localStorage.getItem("allHolesData")) || {};
    const prevHoleData = allHolesData[prevHole];
    if (prevHoleData) {
      setPar(prevHoleData.par || 4);
      setScores(prevHoleData.scores || scores);
    }
  };

  //Hole BUtton
  const getParOfHole = (h) => {
    try {
      const all = JSON.parse(localStorage.getItem("allHolesData") || "{}");
      const slot = all[String(h)];
      return Number(slot?.par ?? 4);
    } catch {
      return 4;
    }
  };

  const handlePickHole = (h) => {
    setHole(h);
    const newPar = getParOfHole(h);
    setPar(newPar);

    try {
      const all = JSON.parse(localStorage.getItem("allHolesData") || "{}");
      const s = all[String(h)]?.scores || null;
      if (s) {
        setScores(withCalcIfReady(s));
      } else {
        setScores((prev) =>
          prev.map((p) => ({ ...p, score: 0, pre_score: 0, nearPin: false }))
        );
      }
    } catch {}

    setShowHolePicker(false);
  };

  //エーラOK＿ENTER
  const handleCloseError = () => {
    setShowError(false);
  };

  // Hole had data storage ?
  const isHoleReady = (h) => {
    try {
      const all = JSON.parse(localStorage.getItem("allHolesData") || "{}");
      const s = all[String(h)]?.scores;
      if (!Array.isArray(s) || s.length < 4) return false;
      const red = s.filter((p) => p?.teamColor === "red").length;
      const blue = s.filter((p) => p?.teamColor === "blue").length;
      return red === 2 && blue === 2;
    } catch {
      return false;
    }
  };

  return (
    <div className="container">
      {/* <h2 className="title">Score Calculator</h2>
      <p className="subtitle">A simple way to track your game points.</p> */}

      <div className="form_container">
        {showError && (
          <div className="error-modal">
            <div className="error-modal-content">
              <p>{errorMessage}</p>
              <button onClick={handleCloseError}>OK</button>
            </div>
          </div>
        )}

        <h3 className="title">{courseName}'s Course</h3>

        <div className="hole-wapper">
          <button type="button" className="total_result" onClick={handleExport}>
            Result
          </button>

          <button
            type="button"
            className="hole-content hole-toggle"
            onClick={() => setShowHolePicker((v) => !v)}
            aria-expanded={showHolePicker}
          >
            <span>{frontName}</span>
            <span>H{hole}</span>
          </button>

          <div className="par-content">
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

        {/* PANEL PICKER */}
        <div className={`hole-picker ${showHolePicker ? "open" : ""}`}>
          <div className="hp-row">
            <div className="hp-section-title">
              {/* 前半 tên custom */}
              {frontName}・中コース
            </div>
            <div className="hp-grid">
              {Array.from({ length: 9 }, (_, i) => i + 1).map((h) => {
                const p = getParOfHole(h);
                const isActive = h === hole;
                const ready = isHoleReady(h);

                return (
                  <button
                    key={h}
                    className={`hp-cell ${isActive ? "active" : ""} ${
                      !ready ? "disabled" : ""
                    }`}
                    onClick={() => {
                      if (!ready) return;
                      handlePickHole(h);
                    }}
                    disabled={!ready}
                    title={!ready ? "Hố này chưa đủ 2 Red + 2 Blue" : ""}
                    aria-disabled={!ready}
                  >
                    <div className="hp-hole">{h}H</div>
                    <div className="hp-par">Par {p}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="hp-row">
            <div className="hp-section-title">
              {/* 後半 tên custom */}
              {state?.backname || "後半"}・西コース
            </div>
            <div className="hp-grid">
              {Array.from({ length: 9 }, (_, i) => i + 10).map((h) => {
                const p = getParOfHole(h);
                const isActive = h === hole;
                const ready = isHoleReady(h);

                return (
                  <button
                    key={h}
                    className={`hp-cell ${isActive ? "active" : ""} ${
                      !ready ? "disabled" : ""
                    }`}
                    onClick={() => {
                      if (!ready) return;
                      handlePickHole(h);
                    }}
                    disabled={!ready}
                    title={!ready ? "Hố này chưa đủ 2 Red + 2 Blue" : ""}
                    aria-disabled={!ready}
                  >
                    <div className="hp-hole">{h}H</div>
                    <div className="hp-par">Par {p}</div>
                  </button>
                );
              })}
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
                  <div className="gross_score">
                    {scores[idx].gross_score + scores[idx].score}
                  </div>
                  <div className="pre_score">
                    {scores[idx].total_score}(
                    {scores[idx].pre_score >= 0 ? "+" : ""}
                    {scores[idx].pre_score})
                  </div>

                  {/* Near Pin label */}
                  {scores[idx].nearPin && <div className="pin-label">ニピ</div>}
                  {scores[idx].reach && (
                    <div className="reach-label">リーチ</div>
                  )}

                  {isActive && (
                    <div
                      className="team-switch"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <label>
                        <input
                          type="checkbox"
                          checked={scores[activePlayerIdx].teamColor === "blue"}
                          onChange={(e) => {
                            setScores((prev) => {
                              const next = prev.map((p, i) =>
                                i === activePlayerIdx
                                  ? {
                                      ...p,
                                      teamColor: e.target.checked
                                        ? "blue"
                                        : "red",
                                    }
                                  : p
                              );
                              return withCalcIfReady(next);
                            });
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span className="team-slider"></span>
                      </label>
                    </div>
                  )}
                  {color && !isActive && (
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

        {visibleBonusOptions.map(({ key, label }) => {
          const isNearPin = key === "nearPin";
          const isDisabled = isNearPin && par !== 3;

          if (key === "custom") {
            const customEnabled =
              !!scores[activePlayerIdx].custom || drawBonus > 0;

            return (
              <div
                key={key}
                className="checkbox-row"
                onClick={(e) => e.stopPropagation()}
              >
                <label className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={customEnabled}
                    onChange={(e) => {
                      //Unnable Onchange
                      if (drawBonus > 0) return;
                      setScores((prev) => {
                        const next = prev.map((p) => ({
                          ...p,
                          custom: e.target.checked,
                          customValue: e.target.checked
                            ? drawBonus > 0
                              ? drawBonus
                              : 1
                            : 0,
                        }));
                        return withCalcIfReady(next);
                      });
                    }}
                    disabled={isDisabled}
                  />
                  {label}
                </label>

                {customEnabled && (
                  <Select
                    className="select-item"
                    value={{
                      value: Number(scores[activePlayerIdx].customValue || 1),
                      label: String(scores[activePlayerIdx].customValue || 1),
                    }}
                    onChange={(option) => {
                      const val = Number(option.value);
                      setScores((prev) => {
                        const next = prev.map((p, i) =>
                          i === activePlayerIdx
                            ? { ...p, customValue: val, custom: true }
                            : p
                        );
                        return withCalcIfReady(next);
                      });
                    }}
                    options={Array.from({ length: 9 }, (_, i) => ({
                      value: i + 1,
                      label: String(i + 1),
                    }))}
                    menuPlacement="top"
                  />
                )}
              </div>
            );
          }

          return (
            <div
              key={key}
              className="checkbox-row"
              onClick={(e) => e.stopPropagation()}
            >
              <label
                className={`checkbox-item ${
                  isDisabled ? "nearpin-disabled" : ""
                }`}
                title={
                  isDisabled
                    ? "Par が 3 でない場合、ニアピンは適用されません。"
                    : ""
                }
              >
                <input
                  type="checkbox"
                  checked={isDisabled ? false : !!scores[activePlayerIdx][key]}
                  onChange={(e) => {
                    if (isDisabled) return;
                    if (key === "nearPin") {
                      setExclusiveNearPin(activePlayerIdx, e.target.checked);
                    } else {
                      setScores((prev) => {
                        const next = [...prev];
                        next[activePlayerIdx][key] = e.target.checked;
                        return withCalcIfReady(next);
                      });
                    }
                  }}
                  disabled={isDisabled}
                />
                {label}
              </label>
            </div>
          );
        })}

        <div className="nav_bar">
          <button id="back_btn" type="button" onClick={() => navigate("/rule")}>
            Setting
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
