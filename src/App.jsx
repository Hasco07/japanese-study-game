import React, { useEffect, useMemo, useRef, useState } from "react";

// Japanese Study Game Hub — single-file prototype (Vite + React)
// - 4 mini-modes: Kana Garden, Ethical Gacha, Cafe VN, Kana Boss Battles
// - Full-screen layout
// - Settings panel (localStorage)
// - Audio pronunciation via Web Speech API (speechSynthesis)

const KANA = [
  { kana: "あ", romaji: "a" },
  { kana: "い", romaji: "i" },
  { kana: "う", romaji: "u" },
  { kana: "え", romaji: "e" },
  { kana: "お", romaji: "o" },
  { kana: "か", romaji: "ka" },
  { kana: "き", romaji: "ki" },
  { kana: "く", romaji: "ku" },
  { kana: "け", romaji: "ke" },
  { kana: "こ", romaji: "ko" },
  { kana: "さ", romaji: "sa" },
  { kana: "し", romaji: "shi" },
  { kana: "す", romaji: "su" },
  { kana: "せ", romaji: "se" },
  { kana: "そ", romaji: "so" },
];

const CAFE_PHRASES = [
  { jp: "いらっしゃいませ！", romaji: "irasshaimase!", en: "Welcome!" },
  {
    jp: "ご注文はお決まりですか？",
    romaji: "go-chuumon wa okimari desu ka?",
    en: "Have you decided on your order?",
  },
  { jp: "コーヒーをお願いします。", romaji: "koohii o onegaishimasu.", en: "Coffee, please." },
  {
    jp: "砂糖とミルクはどうしますか？",
    romaji: "satou to miruku wa dou shimasu ka?",
    en: "How about sugar and milk?",
  },
  { jp: "ここで召し上がりますか？", romaji: "koko de meshiagarimasu ka?", en: "For here?" },
  { jp: "お会計は700円です。", romaji: "okaikei wa nanahyaku-en desu.", en: "Your total is 700 yen." },
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function todayKey() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function useLocalStorageState(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore
    }
  }, [key, value]);

  return [value, setValue];
}

// Web Speech API helper (fast prototype audio)
function speakJP(text, settings) {
  const enabled = settings?.audioEnabled ?? true;
  if (!enabled) return;
  if (!text) return;
  if (!("speechSynthesis" in window)) return;

  const u = new SpeechSynthesisUtterance(text);
  u.lang = "ja-JP";
  u.rate = Number.isFinite(settings?.rate) ? settings.rate : 0.9;
  u.pitch = Number.isFinite(settings?.pitch) ? settings.pitch : 1;
  u.volume = Number.isFinite(settings?.volume) ? settings.volume : 1;

  // Pick a Japanese voice if available (best effort)
  const pickVoice = () => {
    try {
      const voices = window.speechSynthesis.getVoices?.() || [];
      const jaVoice = voices.find((v) => (v.lang || "").toLowerCase().startsWith("ja"));
      if (jaVoice) u.voice = jaVoice;
    } catch {
      // ignore
    }
  };

  pickVoice();
  setTimeout(pickVoice, 0);

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

function Pill({ children }) {
  return <span style={styles.pill}>{children}</span>;
}

function Card({ title, right, children }) {
  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <div style={{ fontSize: 20, fontWeight: 700 }}>{title}</div>
        <div>{right}</div>
      </div>
      {children}
    </div>
  );
}

function Button({ children, onClick, variant = "primary", disabled, title }) {
  const base = {
    borderRadius: 14,
    padding: "10px 14px",
    fontSize: 14,
    fontWeight: 700,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.55 : 1,
    border: "1px solid rgba(0,0,0,0.15)",
    transition: "transform 0.05s ease",
    userSelect: "none",
  };

  let style = { ...base, background: "#111", color: "white", border: "1px solid #111" };
  if (variant === "secondary") style = { ...base, background: "white", color: "#111" };
  if (variant === "ghost") style = { ...base, background: "transparent", color: "#111" };

  return (
    <button
      style={style}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      title={title}
      onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.99)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      {children}
    </button>
  );
}

function ProgressBar({ value, max }) {
  const pct = max <= 0 ? 0 : Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div style={styles.barOuter}>
      <div style={{ ...styles.barInner, width: `${pct}%` }} />
    </div>
  );
}

function KanaMultipleChoice({ mode, pool = KANA, onDone, settings }) {
  const [idx, setIdx] = useState(0);
  const [order, setOrder] = useState(() => shuffle(pool).slice(0, 10));
  const [correct, setCorrect] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [picked, setPicked] = useState(null);

  useEffect(() => {
    setIdx(0);
    setOrder(shuffle(pool).slice(0, 10));
    setCorrect(0);
    setAnswered(false);
    setPicked(null);
  }, [mode, pool]);

  const current = order[idx];

  const options = useMemo(() => {
    if (!current) return [];
    const others = shuffle(pool.filter((x) => x.kana !== current.kana)).slice(0, 3);
    return shuffle([current, ...others]);
  }, [current, pool]);

  function label(item) {
    if (!item) return "";
    // Defensive: if a field is missing, fall back so buttons never render blank.
    if (mode === "kana-to-romaji") return item.romaji || item.kana || "";
    return item.kana || item.romaji || "";
  }

  function prompt() {
    if (!current) return "";
    if (mode === "kana-to-romaji") return current.kana || current.romaji || "";
    return current.romaji || current.kana || "";
  }

  function answer(item) {
    if (answered) return;
    setAnswered(true);
    setPicked(item?.kana ?? null);

    const ok = item?.kana === current?.kana;
    if (ok) setCorrect((c) => c + 1);

    setTimeout(() => {
      const next = idx + 1;
      if (next >= order.length) {
        const finalCorrect = ok ? correct + 1 : correct;
        onDone?.({ total: order.length, correct: finalCorrect });
      } else {
        setIdx(next);
        setAnswered(false);
        setPicked(null);
      }
    }, 500);
  }

  if (!current) return null;

  const audioEnabled = settings?.audioEnabled ?? true;
  const speakText = current.kana; // always speak kana

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
        <Pill>
          Question {idx + 1}/{order.length}
        </Pill>
        <Pill>
          Score {correct}/{order.length}
        </Pill>
      </div>

      <div style={styles.promptBox}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 12, opacity: 0.65 }}>Select the match</div>
          <Button
            variant="secondary"
            onClick={() => speakJP(speakText, settings)}
            disabled={!audioEnabled}
            title={audioEnabled ? "Speak" : "Enable audio in Settings"}
          >
            🔊 Speak
          </Button>
        </div>

        <div style={{ fontSize: 52, fontWeight: 800, marginTop: 6 }}>{prompt()}</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {options.map((opt, i) => {
          const key = opt?.kana ? `${opt.kana}-${i}` : `opt-${i}`;
          const isPicked = picked != null && picked === opt?.kana;
          const isCorrect = opt?.kana === current?.kana;

          const outline =
            answered && isPicked
              ? isCorrect
                ? "2px solid #111"
                : "2px solid rgba(0,0,0,0.25)"
              : "1px solid rgba(0,0,0,0.15)";

          return (
            <button key={key} onClick={() => answer(opt)} style={{ ...styles.choice, border: outline }}>
              {label(opt)}
            </button>
          );
        })}
      </div>

      <div style={{ fontSize: 12, opacity: 0.7 }}>
        Tip: If you want handwriting practice, keep a notebook next to you and write the answer before you click.
      </div>
    </div>
  );
}

function KanaGarden({ settings }) {
  const [garden, setGarden] = useLocalStorageState("jg_garden", {
    lastDay: null,
    streak: 0,
    water: 0,
    sunlight: 0,
    fertilizer: 0,
    tiles: Array.from({ length: 9 }).map(() => ({ stage: 0 })), // 0..3
  });

  const [mode, setMode] = useState("kana-to-romaji");
  const [session, setSession] = useState({ inProgress: false, done: false, result: null });

  const todays = todayKey();

  function prevDay(iso) {
    const [y, m, d] = iso.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() - 1);
    const yyyy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, "0");
    const dd = String(dt.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  function start() {
    setSession({ inProgress: true, done: false, result: null });
  }

  function finish(result) {
    setSession({ inProgress: false, done: true, result });

    const okRatio = result.correct / result.total;
    const earnedWater = Math.round(5 + okRatio * 5);
    const earnedSun = okRatio >= 0.8 ? 3 : okRatio >= 0.6 ? 2 : 1;
    const earnedFert = okRatio >= 0.9 ? 1 : 0;

    setGarden((g) => {
      const isNewDay = g.lastDay !== todays;
      const nextStreak = isNewDay ? (g.lastDay ? (g.lastDay === prevDay(todays) ? g.streak + 1 : 1) : 1) : g.streak;

      return {
        ...g,
        lastDay: todays,
        streak: nextStreak,
        water: g.water + earnedWater,
        sunlight: g.sunlight + earnedSun,
        fertilizer: g.fertilizer + earnedFert,
      };
    });
  }

  function grow(tileIndex) {
    setGarden((g) => {
      const tiles = [...g.tiles];
      const t = { ...tiles[tileIndex] };
      if (t.stage >= 3) return g;

      const costW = 3 + t.stage;
      const costS = 2;
      const costF = t.stage === 2 ? 1 : 0;

      if (g.water < costW || g.sunlight < costS || g.fertilizer < costF) return g;

      t.stage += 1;
      tiles[tileIndex] = t;
      return {
        ...g,
        water: g.water - costW,
        sunlight: g.sunlight - costS,
        fertilizer: g.fertilizer - costF,
        tiles,
      };
    });
  }

  function resetAll() {
    setGarden({
      lastDay: null,
      streak: 0,
      water: 0,
      sunlight: 0,
      fertilizer: 0,
      tiles: Array.from({ length: 9 }).map(() => ({ stage: 0 })),
    });
    setSession({ inProgress: false, done: false, result: null });
  }

  const grown = garden.tiles.reduce((acc, t) => acc + t.stage, 0);

  return (
    <Card
      title="Kana Garden"
      right={
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Pill>Streak: {garden.streak}</Pill>
          <Button variant="ghost" onClick={resetAll}>
            Reset
          </Button>
        </div>
      }
    >
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        <Pill>Water: {garden.water}</Pill>
        <Pill>Sun: {garden.sunlight}</Pill>
        <Pill>Fertilizer: {garden.fertilizer}</Pill>
        <Pill>Growth: {grown}/27</Pill>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ display: "grid", gap: 12 }}>
          <div style={styles.panel}>
            <div style={{ fontSize: 12, opacity: 0.65, marginBottom: 8 }}>Daily practice</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Button variant={mode === "kana-to-romaji" ? "primary" : "secondary"} onClick={() => setMode("kana-to-romaji")}>
                Kana → Romaji
              </Button>
              <Button variant={mode === "romaji-to-kana" ? "primary" : "secondary"} onClick={() => setMode("romaji-to-kana")}>
                Romaji → Kana
              </Button>
              <Button onClick={start} disabled={session.inProgress}>
                Start 10-question session
              </Button>
            </div>
            <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
              Complete a session to earn resources. Spend resources to grow your garden tiles.
            </div>
          </div>

          {session.inProgress ? (
            <div style={styles.panel}>
              <KanaMultipleChoice mode={mode} onDone={finish} settings={settings} />
            </div>
          ) : session.done ? (
            <div style={styles.panel}>
              <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>Session complete</div>
              <div style={{ fontSize: 13, opacity: 0.75 }}>
                You got {session.result.correct}/{session.result.total}. Go grow something 🌿
              </div>
            </div>
          ) : null}
        </div>

        <div>
          <div style={{ fontSize: 12, opacity: 0.65, marginBottom: 8 }}>Garden (click a tile to grow)</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            {garden.tiles.map((t, i) => {
              const stages = ["Seed", "Sprout", "Bud", "Bloom"];
              const label = stages[t.stage] ?? "?";
              return (
                <button key={i} style={styles.tile} onClick={() => grow(i)}>
                  <div style={{ fontSize: 11, opacity: 0.65 }}>Tile {i + 1}</div>
                  <div style={{ fontSize: 18, fontWeight: 800 }}>{label}</div>
                  <div style={{ marginTop: 8 }}>
                    <ProgressBar value={t.stage} max={3} />
                  </div>
                  <div style={{ marginTop: 8, fontSize: 11, opacity: 0.65 }}>
                    Cost: {3 + t.stage} water, 2 sun{t.stage === 2 ? ", 1 fert" : ""}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}

function EthicalGacha({ settings }) {
  const [state, setState] = useLocalStorageState("jg_gacha", {
    tickets: 0,
    dust: 0,
    pulls: 0,
    owned: {},
    pity: 0,
  });
  const [mode, setMode] = useState("kana-to-romaji");
  const [session, setSession] = useState({ inProgress: false, done: false, result: null });
  const [lastPull, setLastPull] = useState(null);

  const collection = useMemo(() => {
    const base = KANA.slice(0, 15).map((k) => ({
      id: `spirit-${k.kana}`,
      name: `${k.kana} Spirit`,
      rarity: "common",
    }));
    const rares = [
      { id: "spirit-sakura", name: "Sakura Spirit", rarity: "rare" },
      { id: "spirit-lantern", name: "Lantern Spirit", rarity: "rare" },
      { id: "spirit-kitsune", name: "Kitsune Spirit", rarity: "rare" },
    ];
    const epics = [
      { id: "spirit-dragon", name: "Dragon Spirit", rarity: "epic" },
      { id: "spirit-phoenix", name: "Phoenix Spirit", rarity: "epic" },
    ];
    return [...base, ...rares, ...epics];
  }, []);

  const ownedCount = Object.keys(state.owned).length;
  const totalCount = collection.length;

  function start() {
    setSession({ inProgress: true, done: false, result: null });
  }

  function finish(result) {
    setSession({ inProgress: false, done: true, result });
    const ratio = result.correct / result.total;
    const earned = ratio >= 0.9 ? 2 : ratio >= 0.7 ? 1 : 0;
    if (earned > 0) setState((s) => ({ ...s, tickets: s.tickets + earned }));
  }

  function pullOne() {
    setState((s) => {
      if (s.tickets <= 0) return s;

      const pityThreshold = 7;
      const ownedIds = new Set(Object.keys(s.owned));
      const unowned = collection.filter((c) => !ownedIds.has(c.id));

      let picked;
      if (unowned.length > 0 && s.pity >= pityThreshold) {
        picked = unowned[Math.floor(Math.random() * unowned.length)];
      } else {
        const roll = Math.random();
        const rarity = roll < 0.85 ? "common" : roll < 0.97 ? "rare" : "epic";
        const pool = collection.filter((c) => c.rarity === rarity);
        picked = pool[Math.floor(Math.random() * pool.length)];
      }

      const nextOwned = { ...s.owned };
      const prev = nextOwned[picked.id] ?? 0;
      nextOwned[picked.id] = prev + 1;

      const isNew = prev === 0;
      const dustEarned = isNew ? 0 : picked.rarity === "common" ? 5 : picked.rarity === "rare" ? 15 : 40;
      const nextPity = isNew ? 0 : s.pity + 1;

      setLastPull(picked);

      return { ...s, tickets: s.tickets - 1, dust: s.dust + dustEarned, pulls: s.pulls + 1, owned: nextOwned, pity: nextPity };
    });
  }

  function craftNew() {
    const cost = 80;
    setState((s) => {
      if (s.dust < cost) return s;
      const ownedIds = new Set(Object.keys(s.owned));
      const unowned = collection.filter((c) => !ownedIds.has(c.id));
      if (unowned.length === 0) return s;
      const picked = unowned[Math.floor(Math.random() * unowned.length)];
      const nextOwned = { ...s.owned, [picked.id]: 1 };
      setLastPull(picked);
      return { ...s, dust: s.dust - cost, owned: nextOwned, pity: 0 };
    });
  }

  function resetAll() {
    setState({ tickets: 0, dust: 0, pulls: 0, owned: {}, pity: 0 });
    setSession({ inProgress: false, done: false, result: null });
    setLastPull(null);
  }

  return (
    <Card
      title="Ethical Gacha Flashcards"
      right={
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Pill>
            Owned: {ownedCount}/{totalCount}
          </Pill>
          <Button variant="ghost" onClick={resetAll}>
            Reset
          </Button>
        </div>
      }
    >
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        <Pill>Tickets: {state.tickets}</Pill>
        <Pill>Dust: {state.dust}</Pill>
        <Pill>Pity: {state.pity}/7</Pill>
        <Pill>Pulls: {state.pulls}</Pill>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ display: "grid", gap: 12 }}>
          <div style={styles.panel}>
            <div style={{ fontSize: 12, opacity: 0.65, marginBottom: 8 }}>Earn tickets</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Button variant={mode === "kana-to-romaji" ? "primary" : "secondary"} onClick={() => setMode("kana-to-romaji")}>
                Kana → Romaji
              </Button>
              <Button variant={mode === "romaji-to-kana" ? "primary" : "secondary"} onClick={() => setMode("romaji-to-kana")}>
                Romaji → Kana
              </Button>
              <Button onClick={start} disabled={session.inProgress}>
                Play 10 questions
              </Button>
            </div>
            <div style={{ marginTop: 10, fontSize: 12, opacity: 0.75 }}>≥70% correct: +1 ticket. ≥90%: +2 tickets.</div>
          </div>

          {session.inProgress ? (
            <div style={styles.panel}>
              <KanaMultipleChoice mode={mode} onDone={finish} settings={settings} />
            </div>
          ) : session.done ? (
            <div style={styles.panel}>
              <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>Round complete</div>
              <div style={{ fontSize: 13, opacity: 0.75 }}>
                {session.result.correct}/{session.result.total} correct.
              </div>
            </div>
          ) : null}

          <div style={styles.panel}>
            <div style={{ fontSize: 12, opacity: 0.65, marginBottom: 8 }}>Pull a capsule</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Button onClick={pullOne} disabled={state.tickets <= 0}>
                Use 1 ticket
              </Button>
              <Button variant="secondary" onClick={craftNew} disabled={state.dust < 80}>
                Craft new (80 dust)
              </Button>
            </div>
            {lastPull ? (
              <div style={{ ...styles.panel, marginTop: 12 }}>
                <div style={{ fontSize: 11, opacity: 0.65 }}>You got</div>
                <div style={{ fontSize: 18, fontWeight: 800 }}>{lastPull.name}</div>
                <div style={{ fontSize: 13, opacity: 0.75 }}>Rarity: {lastPull.rarity}</div>
              </div>
            ) : (
              <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>No pull yet.</div>
            )}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 12, opacity: 0.65, marginBottom: 8 }}>Collection</div>
          <div style={{ ...styles.panel, maxHeight: 420, overflow: "auto" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {collection.map((c) => {
                const owned = state.owned[c.id] ?? 0;
                return (
                  <div key={c.id} style={{ border: "1px solid rgba(0,0,0,0.15)", borderRadius: 14, padding: 12, background: "white" }}>
                    <div style={{ fontSize: 13, fontWeight: 800 }}>{c.name}</div>
                    <div style={{ fontSize: 11, opacity: 0.65 }}>{c.rarity}</div>
                    <div style={{ marginTop: 8, fontSize: 12 }}>Owned: {owned}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function CafeVN({ settings }) {
  const [progress, setProgress] = useLocalStorageState("jg_cafe", { sceneIndex: 0, stars: 0, mastered: {} });
  const [showHint, setShowHint] = useState(true);
  const [choice, setChoice] = useState(null);

  const scene = CAFE_PHRASES[progress.sceneIndex % CAFE_PHRASES.length];

  const options = useMemo(() => {
    const correct = scene.en;
    const decoys = shuffle(CAFE_PHRASES.filter((p) => p.en !== correct))
      .slice(0, 3)
      .map((p) => p.en);
    return shuffle([correct, ...decoys]);
  }, [scene]);

  function pick(opt) {
    setChoice(opt);
    const ok = opt === scene.en;
    setTimeout(() => {
      setProgress((p) => {
        const idx = p.sceneIndex;
        const mastered = { ...p.mastered };
        if (ok) mastered[idx] = true;
        return { ...p, sceneIndex: idx + 1, stars: p.stars + (ok ? 1 : 0), mastered };
      });
      setChoice(null);
    }, 600);
  }

  function resetAll() {
    setProgress({ sceneIndex: 0, stars: 0, mastered: {} });
    setChoice(null);
  }

  const masteredCount = Object.keys(progress.mastered).length;
  const audioEnabled = settings?.audioEnabled ?? true;

  return (
    <Card
      title="Café Visual Novel (Micro)"
      right={
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Pill>Stars: {progress.stars}</Pill>
          <Pill>
            Mastered: {masteredCount}/{CAFE_PHRASES.length}
          </Pill>
          <Button variant="ghost" onClick={resetAll}>
            Reset
          </Button>
        </div>
      }
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={styles.panel}>
          <div style={{ fontSize: 12, opacity: 0.65 }}>Scene</div>
          <div style={{ marginTop: 8, fontSize: 30, fontWeight: 800 }}>{scene.jp}</div>

          <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Button
              variant="secondary"
              onClick={() => speakJP(scene.jp, settings)}
              disabled={!audioEnabled}
              title={audioEnabled ? "Speak" : "Enable audio in Settings"}
            >
              🔊 Speak
            </Button>
            <Button variant="secondary" onClick={() => setShowHint((v) => !v)}>
              {showHint ? "Hide romaji" : "Show romaji"}
            </Button>
          </div>

          <div style={{ marginTop: 10, fontSize: 13, opacity: 0.75 }}>{showHint ? scene.romaji : "••••••••••"}</div>

          <div style={{ marginTop: 12, fontSize: 12, opacity: 0.65 }}>Pick the best meaning.</div>
        </div>

        <div style={{ display: "grid", gap: 10 }}>
          {options.map((opt) => {
            const isPicked = choice === opt;
            const ok = opt === scene.en;
            const outline =
              choice && isPicked ? (ok ? "2px solid #111" : "2px solid rgba(0,0,0,0.25)") : "1px solid rgba(0,0,0,0.15)";
            return (
              <button key={opt} onClick={() => pick(opt)} style={{ ...styles.choiceWide, border: outline }} disabled={choice !== null}>
                {opt}
              </button>
            );
          })}
          <div style={{ fontSize: 12, opacity: 0.7 }}>Tiny habit: read the Japanese out loud before you pick. Repeat it once after.</div>
        </div>
      </div>
    </Card>
  );
}

function BossBattles() {
  const BOSSES = useMemo(
    () => [
      { id: "boss-a", name: "A-Row Boss", set: ["a", "i", "u", "e", "o"] },
      { id: "boss-k", name: "K-Row Boss", set: ["ka", "ki", "ku", "ke", "ko"] },
      { id: "boss-s", name: "S-Row Boss", set: ["sa", "shi", "su", "se", "so"] },
    ],
    []
  );

  const [save, setSave] = useLocalStorageState("jg_boss", { cleared: {} });
  const [active, setActive] = useState(BOSSES[0].id);
  const [round, setRound] = useState({ started: false, done: false, i: 0, order: [], startMs: 0, endMs: 0, input: "" });
  const inputRef = useRef(null);

  const boss = BOSSES.find((b) => b.id === active) || BOSSES[0];
  const kanaSet = useMemo(() => KANA.filter((k) => boss.set.includes(k.romaji)), [boss]);

  function start() {
    const order = shuffle(kanaSet);
    setRound({ started: true, done: false, i: 0, order, startMs: Date.now(), endMs: 0, input: "" });
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function submit() {
    if (!round.started || round.done) return;
    const current = round.order[round.i];
    if (!current) return;

    const typed = round.input.trim().toLowerCase();
    const ok = typed === current.romaji;

    if (ok) {
      const next = round.i + 1;
      if (next >= round.order.length) {
        const endMs = Date.now();
        const timeMs = endMs - round.startMs;
        setRound((r) => ({ ...r, done: true, endMs, input: "" }));
        setSave((s) => {
          const best = s.cleared[boss.id];
          const improved = best == null || timeMs < best;
          return { ...s, cleared: { ...s.cleared, [boss.id]: improved ? timeMs : best } };
        });
      } else {
        setRound((r) => ({ ...r, i: next, input: "" }));
      }
    } else {
      setRound((r) => ({ ...r, input: "" }));
    }
  }

  function formatMs(ms) {
    return `${(ms / 1000).toFixed(2)}s`;
  }

  function resetAll() {
    setSave({ cleared: {} });
    setRound({ started: false, done: false, i: 0, order: [], startMs: 0, endMs: 0, input: "" });
  }

  const current = round.order[round.i];
  const best = save.cleared[boss.id];

  return (
    <Card
      title="Kana Boss Battles"
      right={
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Pill>Best: {best ? formatMs(best) : "—"}</Pill>
          <Button variant="ghost" onClick={resetAll}>
            Reset
          </Button>
        </div>
      }
    >
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        {BOSSES.map((b) => (
          <Button
            key={b.id}
            variant={active === b.id ? "primary" : "secondary"}
            onClick={() => {
              setActive(b.id);
              setRound({ started: false, done: false, i: 0, order: [], startMs: 0, endMs: 0, input: "" });
            }}
          >
            {b.name}
          </Button>
        ))}
        <Button onClick={start} disabled={round.started && !round.done}>
          Start fight
        </Button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ ...styles.panel, textAlign: "center" }}>
          <div style={{ fontSize: 12, opacity: 0.65 }}>Type the romaji for</div>
          <div style={{ marginTop: 10, fontSize: 60, fontWeight: 900 }}>{current ? current.kana : "—"}</div>
          <div style={{ marginTop: 12 }}>
            <ProgressBar value={round.i} max={round.order.length || 1} />
          </div>
          <div style={{ marginTop: 8, fontSize: 12, opacity: 0.65 }}>
            {round.started ? `Step ${Math.min(round.i + 1, round.order.length)}/${round.order.length}` : "Pick a boss and start"}
          </div>
        </div>

        <div style={styles.panel}>
          <div style={{ fontSize: 12, opacity: 0.65, marginBottom: 8 }}>Your answer</div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              ref={inputRef}
              value={round.input}
              onChange={(e) => setRound((r) => ({ ...r, input: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
              }}
              placeholder="e.g., ka"
              style={styles.input}
              disabled={!round.started || round.done}
            />
            <Button onClick={submit} disabled={!round.started || round.done}>
              Submit
            </Button>
          </div>

          {round.done ? (
            <div style={{ ...styles.panel, marginTop: 12 }}>
              <div style={{ fontSize: 16, fontWeight: 900 }}>Boss cleared 🎉</div>
              <div style={{ fontSize: 13, opacity: 0.75, marginTop: 4 }}>Time: {formatMs(round.endMs - round.startMs)}</div>
              {best ? <div style={{ fontSize: 12, opacity: 0.65, marginTop: 6 }}>Best for this boss: {formatMs(best)}</div> : null}
              <div style={{ marginTop: 12 }}>
                <Button onClick={start}>Run it again</Button>
              </div>
            </div>
          ) : (
            <div style={{ marginTop: 12, fontSize: 12, opacity: 0.7 }}>
              Wrong answers just clear the input—keep going. Speed comes from repetition.
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

function SettingsPanel({ settings, setSettings, onClose }) {
  const audioEnabled = settings?.audioEnabled ?? true;
  const rate = Number.isFinite(settings?.rate) ? settings.rate : 0.9;
  const pitch = Number.isFinite(settings?.pitch) ? settings.pitch : 1;
  const volume = Number.isFinite(settings?.volume) ? settings.volume : 1;

  return (
    <div style={styles.panel}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
        <div style={{ fontWeight: 900, fontSize: 16 }}>Settings</div>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </div>

      <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
        <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <input
            type="checkbox"
            checked={audioEnabled}
            onChange={(e) => setSettings((s) => ({ ...s, audioEnabled: e.target.checked }))}
          />
          Audio pronunciation (Japanese voice)
        </label>

        <div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Speech rate: {rate}</div>
          <input
            type="range"
            min="0.6"
            max="1.2"
            step="0.05"
            value={rate}
            onChange={(e) => setSettings((s) => ({ ...s, rate: Number(e.target.value) }))}
            style={{ width: "100%" }}
          />
        </div>

        <div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Pitch: {pitch}</div>
          <input
            type="range"
            min="0.6"
            max="1.4"
            step="0.05"
            value={pitch}
            onChange={(e) => setSettings((s) => ({ ...s, pitch: Number(e.target.value) }))}
            style={{ width: "100%" }}
          />
        </div>

        <div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Volume: {volume}</div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(e) => setSettings((s) => ({ ...s, volume: Number(e.target.value) }))}
            style={{ width: "100%" }}
          />
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Button
            onClick={() => speakJP("いらっしゃいませ！", { audioEnabled, rate, pitch, volume })}
            disabled={!audioEnabled}
            title={audioEnabled ? "Test voice" : "Enable audio first"}
          >
            🔊 Test voice
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              try {
                window.speechSynthesis.getVoices?.();
              } catch {
                // ignore
              }
            }}
          >
            Refresh voices
          </Button>
        </div>

        <div style={{ fontSize: 12, opacity: 0.65 }}>
          Note: some browsers (especially iPhone) require a button click before audio works. If you don’t hear it, tap 🔊 again.
        </div>
      </div>
    </div>
  );
}

export default function App() {
  // Full-bleed viewport
  useEffect(() => {
    try {
      document.documentElement.style.height = "100%";
      document.body.style.height = "100%";
      document.body.style.margin = "0";
      document.body.style.padding = "0";
      document.body.style.width = "100%";
    } catch {
      // ignore
    }
  }, []);

  const tabs = [
    { id: "garden", label: "Kana Garden" },
    { id: "gacha", label: "Ethical Gacha" },
    { id: "cafe", label: "Café VN" },
    { id: "boss", label: "Boss Battles" },
  ];

  const [tab, setTab] = useState("garden");

  const [settings, setSettings] = useLocalStorageState("jg_settings", {
    audioEnabled: true,
    rate: 0.9,
    pitch: 1,
    volume: 1,
  });

  const [showSettings, setShowSettings] = useState(false);

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={{ display: "grid", gap: 6 }}>
          <div style={{ fontSize: 30, fontWeight: 900 }}>Japanese Study Game Hub</div>
          <div style={{ fontSize: 13, opacity: 0.7 }}>Full-screen prototype. Progress + settings save locally in your browser.</div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          {tabs.map((t) => (
            <Button key={t.id} variant={tab === t.id ? "primary" : "secondary"} onClick={() => setTab(t.id)}>
              {t.label}
            </Button>
          ))}

          <div style={{ flex: 1 }} />

          <Button variant="secondary" onClick={() => setShowSettings((v) => !v)}>
            Settings
          </Button>
        </div>

        {showSettings ? (
          <SettingsPanel
            settings={settings}
            setSettings={setSettings}
            onClose={() => setShowSettings(false)}
          />
        ) : null}

        {tab === "garden" ? <KanaGarden settings={settings} /> : null}
        {tab === "gacha" ? <EthicalGacha settings={settings} /> : null}
        {tab === "cafe" ? <CafeVN settings={settings} /> : null}
        {tab === "boss" ? <BossBattles /> : null}

        <div style={styles.footer}>
          Next “phone app” step (fastest): convert this to a <b>PWA</b> (installable). After that, you can decide whether you still need React Native.
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    width: "100vw",
    margin: 0,
    padding: 0,
    background: "linear-gradient(#fff, rgba(0,0,0,0.05))",
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
    color: "#111",
  },
  container: {
    width: "100%",
    maxWidth: "100%",
    margin: 0,
    padding: 16,
    boxSizing: "border-box",
    display: "grid",
    gap: 14,
  },
  card: {
    borderRadius: 18,
    border: "1px solid rgba(0,0,0,0.12)",
    background: "rgba(255,255,255,0.75)",
    padding: 16,
  },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 12 },
  pill: { padding: "6px 10px", borderRadius: 999, border: "1px solid rgba(0,0,0,0.15)", fontSize: 12, background: "white" },
  panel: { borderRadius: 18, border: "1px solid rgba(0,0,0,0.12)", background: "white", padding: 14 },
  promptBox: { borderRadius: 18, border: "1px solid rgba(0,0,0,0.12)", background: "white", padding: 18, textAlign: "center" },
  choice: { borderRadius: 16, padding: 14, background: "white", cursor: "pointer", fontSize: 18, fontWeight: 800 },
  choiceWide: {
    borderRadius: 16,
    padding: 14,
    background: "white",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 800,
    textAlign: "left",
  },
  tile: { borderRadius: 18, border: "1px solid rgba(0,0,0,0.12)", background: "white", padding: 12, textAlign: "left", cursor: "pointer" },
  barOuter: { height: 10, borderRadius: 999, background: "rgba(0,0,0,0.1)", overflow: "hidden" },
  barInner: { height: "100%", background: "#111" },
  input: { width: "100%", borderRadius: 14, border: "1px solid rgba(0,0,0,0.2)", padding: "10px 12px", fontSize: 14 },
  footer: { borderRadius: 18, border: "1px solid rgba(0,0,0,0.12)", background: "rgba(255,255,255,0.75)", padding: 14, fontSize: 13 },
};
