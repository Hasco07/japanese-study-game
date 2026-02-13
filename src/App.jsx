import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

const HIRAGANA = [
  ["あ", "a"], ["い", "i"], ["う", "u"], ["え", "e"], ["お", "o"],
  ["か", "ka"], ["き", "ki"], ["く", "ku"], ["け", "ke"], ["こ", "ko"],
  ["さ", "sa"], ["し", "shi"], ["す", "su"], ["せ", "se"], ["そ", "so"],
  ["た", "ta"], ["ち", "chi"], ["つ", "tsu"], ["て", "te"], ["と", "to"],
  ["な", "na"], ["に", "ni"], ["ぬ", "nu"], ["ね", "ne"], ["の", "no"],
  ["は", "ha"], ["ひ", "hi"], ["ふ", "fu"], ["へ", "he"], ["ほ", "ho"],
  ["ま", "ma"], ["み", "mi"], ["む", "mu"], ["め", "me"], ["も", "mo"],
  ["や", "ya"], ["ゆ", "yu"], ["よ", "yo"], ["ら", "ra"], ["り", "ri"],
  ["る", "ru"], ["れ", "re"], ["ろ", "ro"], ["わ", "wa"], ["を", "wo"], ["ん", "n"],
].map(([kana, romaji]) => ({ kana, romaji, set: "Hiragana" }));

const KATAKANA_CHARS = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン";
const KATAKANA = HIRAGANA.map((k, i) => ({ ...k, kana: KATAKANA_CHARS[i], set: "Katakana" }));
const KANA_POOL = [...HIRAGANA, ...KATAKANA];

const CAFE_PHRASES = [
  { jp: "いらっしゃいませ！", romaji: "irasshaimase!", en: "Welcome!" },
  { jp: "ご注文はお決まりですか？", romaji: "go-chuumon wa okimari desu ka?", en: "Have you decided on your order?" },
  { jp: "コーヒーをお願いします。", romaji: "koohii o onegaishimasu.", en: "Coffee, please." },
  { jp: "砂糖とミルクはどうしますか？", romaji: "satou to miruku wa dou shimasu ka?", en: "How about sugar and milk?" },
  { jp: "ここで召し上がりますか？", romaji: "koko de meshiagarimasu ka?", en: "For here?" },
  { jp: "お会計は700円です。", romaji: "okaikei wa nanahyaku-en desu.", en: "Your total is 700 yen." },
];

const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);
const STAGES = ["🌱", "🌿", "🌸", "🌺"];

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
      // ignore write issues
    }
  }, [key, value]);

  return [value, setValue];
}

function QuizPanel({ mode, setMode, onCorrect, className = "" }) {
  const [question, setQuestion] = useState(() => {
    const current = KANA_POOL[Math.floor(Math.random() * KANA_POOL.length)];
    return { current, choices: shuffle([current, ...shuffle(KANA_POOL.filter((k) => k.kana !== current.kana)).slice(0, 3)]) };
  });
  const [answered, setAnswered] = useState(null);

  function nextQuestion() {
    const current = KANA_POOL[Math.floor(Math.random() * KANA_POOL.length)];
    setQuestion({ current, choices: shuffle([current, ...shuffle(KANA_POOL.filter((k) => k.kana !== current.kana)).slice(0, 3)]) });
  }

  function pickAnswer(opt) {
    if (answered) return;
    const ok = opt.kana === question.current.kana;
    setAnswered(ok ? "correct" : opt.kana);
    if (ok) onCorrect?.();
    setTimeout(() => {
      setAnswered(null);
      nextQuestion();
    }, 420);
  }

  const answerLabel = (item) => (mode === "kana-to-romaji" ? item.romaji : item.kana);
  const prompt = mode === "kana-to-romaji" ? question.current.kana : question.current.romaji;

  return (
    <article className={`card ${className}`}>
      <div className="row">
        <h2>Flashcard Quiz</h2>
        <div className="switches">
          <button className={`btn ${mode === "kana-to-romaji" ? "active" : ""}`} onClick={() => setMode("kana-to-romaji")}>Kana → Romaji</button>
          <button className={`btn ${mode === "romaji-to-kana" ? "active" : ""}`} onClick={() => setMode("romaji-to-kana")}>Romaji → Kana</button>
        </div>
      </div>
      <p className="prompt">{prompt}</p>
      <p className="helper">Set: {question.current.set}</p>
      <div className="answers">
        {question.choices.map((choice) => {
          const isCorrect = choice.kana === question.current.kana;
          const selectedWrong = answered === choice.kana;
          return (
            <button
              key={`${choice.kana}-${choice.set}`}
              className={`answer ${answered === "correct" && isCorrect ? "good" : ""} ${selectedWrong ? "bad" : ""}`}
              onClick={() => pickAnswer(choice)}
            >
              {answerLabel(choice)}
            </button>
          );
        })}
      </div>
    </article>
  );
}

function GardenTab() {
  const [mode, setMode] = useState("kana-to-romaji");
  const [resources, setResources] = useLocalStorageState("jaala_resources", { water: 0, sun: 0, fertilizer: 0, score: 0 });
  const [garden, setGarden] = useLocalStorageState("jaala_garden", Array.from({ length: 9 }, () => 0));
  const costs = useMemo(() => [
    { water: 2, sun: 1, fertilizer: 0 },
    { water: 3, sun: 2, fertilizer: 0 },
    { water: 4, sun: 2, fertilizer: 1 },
  ], []);

  const grown = garden.reduce((a, b) => a + b, 0);

  function onCorrect() {
    setResources((r) => ({ ...r, score: r.score + 1, water: r.water + 2, sun: r.sun + 1, fertilizer: r.fertilizer + (Math.random() > 0.65 ? 1 : 0) }));
  }

  function growTile(idx) {
    const stage = garden[idx];
    if (stage >= 3) return;
    const cost = costs[stage];
    if (resources.water < cost.water || resources.sun < cost.sun || resources.fertilizer < cost.fertilizer) return;
    const next = [...garden];
    next[idx] = stage + 1;
    setGarden(next);
    setResources((r) => ({ ...r, water: r.water - cost.water, sun: r.sun - cost.sun, fertilizer: r.fertilizer - cost.fertilizer }));
  }

  return (
    <>
      <section className="stats">
        <div className="pill">Score: {resources.score}</div>
        <div className="pill">💧 Water: {resources.water}</div>
        <div className="pill">☀️ Sun: {resources.sun}</div>
        <div className="pill">🧪 Fertilizer: {resources.fertilizer}</div>
        <div className="pill">Garden Growth: {grown}/27</div>
      </section>

      <section className="layout">
        <QuizPanel mode={mode} setMode={setMode} onCorrect={onCorrect} className="quiz" />
        <article className="card">
          <h2>Garden View</h2>
          <p className="helper">Tap a tile to spend resources and grow your flowers.</p>
          <div className="tiles">
            {garden.map((stage, idx) => {
              const nextCost = costs[Math.min(stage, 2)];
              return (
                <button key={idx} className="tile" onClick={() => growTile(idx)}>
                  <div>Tile {idx + 1}</div>
                  <div className="plant">{STAGES[stage]}</div>
                  <small>{stage === 3 ? "Fully bloomed 🌸" : `Next: ${nextCost.water}💧 ${nextCost.sun}☀️ ${nextCost.fertilizer}🧪`}</small>
                </button>
              );
            })}
          </div>
        </article>
      </section>
    </>
  );
}

function GachaTab() {
  const [mode, setMode] = useState("kana-to-romaji");
  const [state, setState] = useLocalStorageState("jaala_gacha", { tickets: 0, pulls: 0, owned: {}, stardust: 0 });
  const [favorites, setFavorites] = useLocalStorageState("jaala_gacha_favorites", []);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [lastPull, setLastPull] = useState(null);

  const collection = useMemo(() => ([
    { id: "spirit-sakura", name: "Sakura Mochi", rarity: "common", emoji: "🌸", vibe: "Sweet blossom friend" },
    { id: "spirit-maneki", name: "Lucky Neko", rarity: "common", emoji: "🐱", vibe: "Brings lucky study streaks" },
    { id: "spirit-matcha", name: "Matcha Pudding", rarity: "common", emoji: "🍵", vibe: "Calm tea-time helper" },
    { id: "spirit-dango", name: "Dango Trio", rarity: "common", emoji: "🍡", vibe: "Cheery snack squad" },
    { id: "spirit-koi", name: "Koi Sparkle", rarity: "rare", emoji: "🎏", vibe: "Shimmering river guardian" },
    { id: "spirit-tanuki", name: "Tanuki Buddy", rarity: "rare", emoji: "🦝", vibe: "Mischief but very lovable" },
    { id: "spirit-kitsune", name: "Kitsune Charm", rarity: "rare", emoji: "🦊", vibe: "Mystic fox with fluffy tails" },
    { id: "spirit-moonbun", name: "Moon Bunny", rarity: "epic", emoji: "🐰", vibe: "Legendary lunar cutie" },
    { id: "spirit-dragon", name: "Pastel Dragon", rarity: "epic", emoji: "🐉", vibe: "Tiny but magical" },
  ]), []);

  const favoriteSet = useMemo(() => new Set(favorites), [favorites]);
  const visibleCollection = showFavoritesOnly
    ? collection.filter((spirit) => favoriteSet.has(spirit.id))
    : collection;

  function stardustForRarity(rarity) {
    if (rarity === "epic") return 20;
    if (rarity === "rare") return 8;
    return 3;
  }

  function onCorrect() {
    setState((s) => ({ ...s, tickets: s.tickets + 1 }));
  }

  function toggleFavorite(id) {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function pullOne() {
    setState((s) => {
      if (s.tickets < 1) return s;
      const roll = Math.random();
      const rarity = roll < 0.82 ? "common" : roll < 0.96 ? "rare" : "epic";
      const pool = collection.filter((c) => c.rarity === rarity);
      const picked = pool[Math.floor(Math.random() * pool.length)];
      const previousCount = s.owned[picked.id] ?? 0;
      const duplicateDust = previousCount > 0 ? stardustForRarity(picked.rarity) : 0;
      setLastPull({ ...picked, duplicateDust });
      return {
        ...s,
        tickets: s.tickets - 1,
        pulls: s.pulls + 1,
        stardust: s.stardust + duplicateDust,
        owned: { ...s.owned, [picked.id]: previousCount + 1 },
      };
    });
  }

  function craftMissing() {
    const cost = 30;
    setState((s) => {
      if (s.stardust < cost) return s;
      const missing = collection.filter((spirit) => !(s.owned[spirit.id] > 0));
      if (missing.length < 1) return s;
      const picked = missing[Math.floor(Math.random() * missing.length)];
      setLastPull({ ...picked, duplicateDust: 0, crafted: true });
      return {
        ...s,
        stardust: s.stardust - cost,
        owned: { ...s.owned, [picked.id]: 1 },
      };
    });
  }

  return (
    <section className="layout single">
      <QuizPanel mode={mode} setMode={setMode} onCorrect={onCorrect} />
      <article className="card">
        <h2>Ethical Gacha</h2>
        <p className="helper">Earn tickets by answering correctly, then collect cute spirits.</p>
        <div className="stats compact">
          <div className="pill">🎟️ Tickets: {state.tickets}</div>
          <div className="pill">✨ Stardust: {state.stardust}</div>
          <div className="pill">Pulls: {state.pulls}</div>
          <div className="pill">Owned: {Object.keys(state.owned).filter((id) => state.owned[id] > 0).length}/{collection.length}</div>
        </div>

        <div className="row">
          <button className="btn active" onClick={pullOne} disabled={state.tickets < 1}>Use 1 ticket</button>
          <button className="btn ghost" onClick={craftMissing} disabled={state.stardust < 30}>Craft missing (30 ✨)</button>
        </div>

        <div className="panel">
          {lastPull ? (
            <div className={`last-pull rarity-${lastPull.rarity}`}>
              <div className="spirit-emoji">{lastPull.emoji}</div>
              <div>
                <p>
                  <b>{lastPull.name}</b> ({lastPull.rarity}) {lastPull.crafted ? "• crafted" : ""}
                </p>
                <p className="helper">{lastPull.vibe}</p>
                {lastPull.duplicateDust > 0 ? <p className="helper">Duplicate converted: +{lastPull.duplicateDust} stardust ✨</p> : null}
              </div>
            </div>
          ) : <p>No pull yet.</p>}
        </div>

        <div className="row collection-tools">
          <label className="favorite-toggle">
            <input type="checkbox" checked={showFavoritesOnly} onChange={(e) => setShowFavoritesOnly(e.target.checked)} />
            My Favorites only
          </label>
          <p className="helper">Tap 💖 on any spirit card to favorite it.</p>
        </div>

        <div className="collection-grid">
          {visibleCollection.map((spirit) => {
            const count = state.owned[spirit.id] ?? 0;
            const unlocked = count > 0;
            const favorited = favoriteSet.has(spirit.id);
            return (
              <div key={spirit.id} className={`spirit-card rarity-${spirit.rarity} ${unlocked ? "" : "locked"}`}>
                <div className="card-top">
                  <div className="spirit-emoji">{unlocked ? spirit.emoji : "❔"}</div>
                  <button className={`fav-btn ${favorited ? "on" : ""}`} onClick={() => toggleFavorite(spirit.id)} title="Toggle favorite">💖</button>
                </div>
                <div className="spirit-name">{unlocked ? spirit.name : "Mystery Spirit"}</div>
                <div className="helper">{unlocked ? spirit.vibe : "Keep studying to discover this cutie"}</div>
                <div className="spirit-meta">{spirit.rarity} · owned {count}</div>
              </div>
            );
          })}
          {showFavoritesOnly && visibleCollection.length === 0 ? (
            <div className="panel">No favorites yet. Mark spirits with 💖 first.</div>
          ) : null}
        </div>
      </article>
    </section>
  );
}

function CafeTab() {
  const [idx, setIdx] = useLocalStorageState("jaala_cafe_idx", 0);
  const [stars, setStars] = useLocalStorageState("jaala_cafe_stars", 0);
  const [choice, setChoice] = useState(null);
  const scene = CAFE_PHRASES[idx % CAFE_PHRASES.length];
  const options = useMemo(() => shuffle([scene.en, ...shuffle(CAFE_PHRASES.filter((p) => p.en !== scene.en)).slice(0, 3).map((p) => p.en)]), [scene]);

  function pick(opt) {
    if (choice) return;
    const ok = opt === scene.en;
    setChoice(opt);
    setTimeout(() => {
      if (ok) setStars((s) => s + 1);
      setIdx((i) => i + 1);
      setChoice(null);
    }, 500);
  }

  return (
    <article className="card">
      <div className="row">
        <h2>Café Visual Novel</h2>
        <div className="pill">⭐ Stars: {stars}</div>
      </div>
      <p className="prompt small">{scene.jp}</p>
      <p className="helper">{scene.romaji}</p>
      <div className="answers stack">
        {options.map((opt) => (
          <button key={opt} className={`answer ${choice === opt && opt === scene.en ? "good" : ""} ${choice === opt && opt !== scene.en ? "bad" : ""}`} onClick={() => pick(opt)}>
            {opt}
          </button>
        ))}
      </div>
    </article>
  );
}

function BossTab() {
  const BOSSES = [
    { id: "a", name: "A-Row Boss", set: ["a", "i", "u", "e", "o"] },
    { id: "k", name: "K-Row Boss", set: ["ka", "ki", "ku", "ke", "ko"] },
    { id: "s", name: "S-Row Boss", set: ["sa", "shi", "su", "se", "so"] },
  ];

  const [active, setActive] = useState(BOSSES[0]);
  const [round, setRound] = useState({ started: false, i: 0, order: [], input: "", done: false });
  const inputRef = useRef(null);

  function start() {
    const order = shuffle(KANA_POOL.filter((k) => active.set.includes(k.romaji)));
    setRound({ started: true, done: false, i: 0, order, input: "" });
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function submit() {
    if (!round.started || round.done) return;
    const current = round.order[round.i];
    if (round.input.trim().toLowerCase() === current.romaji) {
      if (round.i + 1 >= round.order.length) {
        setRound((r) => ({ ...r, done: true, input: "" }));
      } else {
        setRound((r) => ({ ...r, i: r.i + 1, input: "" }));
      }
    } else {
      setRound((r) => ({ ...r, input: "" }));
    }
  }

  const current = round.order[round.i];

  return (
    <article className="card">
      <div className="row">
        <h2>Kana Boss Battles</h2>
        <div className="switches">
          {BOSSES.map((b) => (
            <button key={b.id} className={`btn ${active.id === b.id ? "active" : ""}`} onClick={() => setActive(b)}>{b.name}</button>
          ))}
          <button className="btn ghost" onClick={start}>Start Fight</button>
        </div>
      </div>
      <p className="prompt">{current ? current.kana : "—"}</p>
      <div className="row">
        <input
          ref={inputRef}
          className="input"
          value={round.input}
          onChange={(e) => setRound((r) => ({ ...r, input: e.target.value }))}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Type romaji"
          disabled={!round.started || round.done}
        />
        <button className="btn active" onClick={submit} disabled={!round.started || round.done}>Submit</button>
      </div>
      <p className="helper">{round.done ? "Boss cleared 🎉" : round.started ? `Step ${round.i + 1}/${round.order.length}` : "Choose boss and start"}</p>
    </article>
  );
}

export default function App() {
  const [tab, setTab] = useState("garden");
  const tabs = [
    { id: "garden", label: "Kana Garden" },
    { id: "gacha", label: "Ethical Gacha" },
    { id: "cafe", label: "Café VN" },
    { id: "boss", label: "Boss Battles" },
  ];

  return (
    <main className="app">
      <header className="hero">
        <div>
          <h1>Jaala’s Kana Garden 🌸</h1>
          <p>Practice hiragana + katakana with cute game modes and visible progress.</p>
        </div>
      </header>

      <section className="tabbar">
        {tabs.map((t) => (
          <button key={t.id} className={`btn ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </section>

      {tab === "garden" && <GardenTab />}
      {tab === "gacha" && <GachaTab />}
      {tab === "cafe" && <CafeTab />}
      {tab === "boss" && <BossTab />}
    </main>
  );
}
