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
      setScores(holeData.scores);
    }
  }, []);

  //NUMPADのロジック
  const [inputBuffers, setInputBuffers] = useState(() => players.map(() => ""));

  const handleNumberClick = (num) => {
    const digit = String(num);

    setInputBuffers((prevBufs) => {
      const nextBufs = [...prevBufs];
      const newBuf = (nextBufs[activePlayerIdx] + digit).slice(-2); // giữ 2 số cuối
      nextBufs[activePlayerIdx] = newBuf;

      // cập nhật scores dựa trên buffer mới
      setScores((prev) => {
        const updated = [...prev];
        const base = newBuf === "" ? 0 : Number(newBuf);
        const delta = updated[activePlayerIdx].nearPin ? 1 : 0;
        updated[activePlayerIdx].score = base;
        updated[activePlayerIdx].pre_score = base + delta;
        return updated;
      });

      return nextBufs;
    });
  };

  // NearPinのロジック
  const setExclusiveNearPin = (targetIdx, checked) => {
    setScores((prev) => {
      return prev.map((s, i) => {
        let delta = 0;

        if (i === targetIdx) {
          if (!s.nearPin && checked) delta = 1; // off -> on
          if (s.nearPin && !checked) delta = 0; // on -> off
          return {
            ...s,
            nearPin: checked,
            pre_score: s.score + delta,
          };
        } else {
          if (s.nearPin) {
            // tắt nearPin người khác
            return {
              ...s,
              nearPin: false,
              pre_score: s.pre_score - 1,
            };
          }
          return { ...s, pre_score: s.score };
        }
      });
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
    const rows = players.map((name, i) => ({
      player: name,
      score: Number(scores[i].score || 0),
      total_score: Number(scores[i].total_score || 0),
      reach: !!scores[i].reach,
      nearPin: !!scores[i].nearPin,
      teamColor: scores[i].teamColor || "",
    }));

    const payload = {
      course: courseName,
      front9: frontName,
      hole: `H${hole}`,
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

    // Lưu hole hiện tại
    saveHoleDataDiff(hole, par, scores);

    // Nếu là hole cuối thì tới kết quả
    if (hole === 18) {
      navigate("/result");
      return;
    }

    // Cập nhật total_score cho hole tiếp theo nếu khác
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

    // Sang hole kế tiếp
    setHole(nextHole);

    // Nếu chưa có dữ liệu hole sau thì reset rỗng, nhưng giữ total_score = tổng trước + pre_score trước
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

        <button type="button" className="export_btn" onClick={handleExport}>
          Export File
        </button>

        <div className="hole-wapper">
          <div className="course_content">
            <span>Course</span>
            <div className="course_title">{courseName}</div>
          </div>
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
                  <div className="pre_score">(+{scores[idx].pre_score})</div>

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
                  const next = [...prev];
                  next[activePlayerIdx].teamColor = e.target.checked
                    ? "blue"
                    : "red";
                  return next;
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
                        // độc quyền nearPin trong 1 hole
                        setExclusiveNearPin(activePlayerIdx, e.target.checked);
                      } else {
                        // các bonus khác giữ nguyên cách cũ
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
