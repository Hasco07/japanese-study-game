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
  ["が", "ga"], ["ぎ", "gi"], ["ぐ", "gu"], ["げ", "ge"], ["ご", "go"],
  ["ざ", "za"], ["じ", "ji"], ["ず", "zu"], ["ぜ", "ze"], ["ぞ", "zo"],
  ["だ", "da"], ["ぢ", "ji"], ["づ", "zu"], ["で", "de"], ["ど", "do"],
  ["ば", "ba"], ["び", "bi"], ["ぶ", "bu"], ["べ", "be"], ["ぼ", "bo"],
  ["ぱ", "pa"], ["ぴ", "pi"], ["ぷ", "pu"], ["ぺ", "pe"], ["ぽ", "po"],
].map(([kana, romaji]) => ({ kana, romaji, set: "Hiragana" }));

const KATAKANA = [
  ["ア", "a"], ["イ", "i"], ["ウ", "u"], ["エ", "e"], ["オ", "o"],
  ["カ", "ka"], ["キ", "ki"], ["ク", "ku"], ["ケ", "ke"], ["コ", "ko"],
  ["サ", "sa"], ["シ", "shi"], ["ス", "su"], ["セ", "se"], ["ソ", "so"],
  ["タ", "ta"], ["チ", "chi"], ["ツ", "tsu"], ["テ", "te"], ["ト", "to"],
  ["ナ", "na"], ["ニ", "ni"], ["ヌ", "nu"], ["ネ", "ne"], ["ノ", "no"],
  ["ハ", "ha"], ["ヒ", "hi"], ["フ", "fu"], ["ヘ", "he"], ["ホ", "ho"],
  ["マ", "ma"], ["ミ", "mi"], ["ム", "mu"], ["メ", "me"], ["モ", "mo"],
  ["ヤ", "ya"], ["ユ", "yu"], ["ヨ", "yo"], ["ラ", "ra"], ["リ", "ri"],
  ["ル", "ru"], ["レ", "re"], ["ロ", "ro"], ["ワ", "wa"], ["ヲ", "wo"], ["ン", "n"],
  ["ガ", "ga"], ["ギ", "gi"], ["グ", "gu"], ["ゲ", "ge"], ["ゴ", "go"],
  ["ザ", "za"], ["ジ", "ji"], ["ズ", "zu"], ["ゼ", "ze"], ["ゾ", "zo"],
  ["ダ", "da"], ["ヂ", "ji"], ["ヅ", "zu"], ["デ", "de"], ["ド", "do"],
  ["バ", "ba"], ["ビ", "bi"], ["ブ", "bu"], ["ベ", "be"], ["ボ", "bo"],
  ["パ", "pa"], ["ピ", "pi"], ["プ", "pu"], ["ペ", "pe"], ["ポ", "po"],
].map(([kana, romaji]) => ({ kana, romaji, set: "Katakana" }));

const KANA_POOL = [...HIRAGANA, ...KATAKANA];

const CAFE_SCENES = [
  { jp: "いらっしゃいませ！", romaji: "irasshaimase!", en: "Welcome!", clerk: "Miki", drink: "Sakura Latte", sweet: "Strawberry Daifuku" },
  { jp: "本日のおすすめは抹茶パフェです。", romaji: "honjitsu no osusume wa matcha pafe desu.", en: "Today's special is the matcha parfait.", clerk: "Aoi", drink: "Matcha Float", sweet: "Matcha Parfait" },
  { jp: "ご注文はお決まりですか？", romaji: "go-chuumon wa okimari desu ka?", en: "Have you decided on your order?", clerk: "Yuna", drink: "Hojicha Milk", sweet: "Melon Pan" },
  { jp: "コーヒーをお願いします。", romaji: "koohii o onegaishimasu.", en: "Coffee, please.", clerk: "Ren", drink: "Kyoto Drip Coffee", sweet: "Yuzu Tart" },
  { jp: "甘さは少なめでお願いします。", romaji: "amasa wa sukuname de onegaishimasu.", en: "Please make it less sweet.", clerk: "Miki", drink: "Osaka Iced Cafe", sweet: "Black Sesame Roll" },
  { jp: "お会計は1200円です。", romaji: "okaikei wa sen nihyaku en desu.", en: "Your total is 1200 yen.", clerk: "Aoi", drink: "Tokyo Mocha", sweet: "Sakura Mont Blanc" },
];

const CITY_NAMES = ["Tokyo", "Kyoto", "Osaka", "Sapporo", "Fukuoka", "Nagoya", "Nara", "Kobe", "Yokohama", "Sendai", "Kamakura", "Kanazawa", "Hiroshima", "Kagoshima", "Nagasaki", "Hakodate", "Niigata", "Matsumoto", "Okayama", "Kochi", "Miyazaki", "Akita", "Aomori", "Shizuoka", "Nikko", "Takayama", "Okinawa", "Beppu", "Otaru", "Chiba", "Uji", "Kawagoe", "Toyama", "Iwaki", "Furano", "Kumamoto", "Saga", "Gifu", "Tottori", "Yamagata"];
const FOOD_NAMES = ["Ramen", "Sushi", "Onigiri", "Takoyaki", "Taiyaki", "Dorayaki", "Mochi", "Dango", "Katsu", "Curry", "Udon", "Soba", "Tempura", "Okonomiyaki", "Yakitori", "Anpan", "Melon Pan", "Crepe", "Parfait", "Miso Soup", "Omurice", "Shabu", "Sukiyaki", "Yakiniku", "Gyoza", "Kakigori", "Yokan", "Monaka", "Manju", "Castella", "Daifuku", "Yuba", "Wagashi", "Purin", "Senbei", "Kombu", "Matcha", "Hojicha", "Amazake", "Yuzu"];
const CULTURE_NAMES = ["Kitsune", "Tanuki", "Daruma", "Torii", "Kimono", "Yukata", "Sakura", "Ukiyo-e", "Origami", "Koi", "Shinkansen", "Lantern", "Samurai", "Ninja", "Shiba", "Fuji", "Onsen", "Taiko", "Matsuri", "Geisha", "Bonsai", "Tea Ceremony", "Kabuki", "Noh", "Ikebana", "Omamori", "Kokeshi", "Temari", "Kumihimo", "Sensu", "Washi", "Maneki", "Inari", "Tengu", "Tsukimi", "Hanami", "Yokai", "Komainu", "Gundam", "Totoro"];

const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

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

function buildSpirits() {
  const citySpirits = CITY_NAMES.map((city, i) => ({
    id: `city-${city.toLowerCase().replace(/\s+/g, "-")}`,
    name: `${city} Skyline Spirit`,
    rarity: i % 17 === 0 ? "epic" : i % 5 === 0 ? "rare" : "common",
    emoji: i % 2 === 0 ? "🏙️" : "🗾",
    vibe: `${city} night lights and travel dreams`,
  }));
  const foodSpirits = FOOD_NAMES.map((food, i) => ({
    id: `food-${food.toLowerCase().replace(/\s+/g, "-")}`,
    name: `${food} Delight`,
    rarity: i % 19 === 0 ? "epic" : i % 4 === 0 ? "rare" : "common",
    emoji: i % 3 === 0 ? "🍡" : i % 3 === 1 ? "🍵" : "🍱",
    vibe: `A cozy bite inspired by ${food}`,
  }));
  const cultureSpirits = CULTURE_NAMES.map((culture, i) => ({
    id: `culture-${culture.toLowerCase().replace(/\s+/g, "-")}`,
    name: `${culture} Charm`,
    rarity: i % 16 === 0 ? "epic" : i % 5 === 0 ? "rare" : "common",
    emoji: i % 2 === 0 ? "✨" : "🎐",
    vibe: `A cute guardian of ${culture}`,
  }));
  return [...citySpirits, ...foodSpirits, ...cultureSpirits];
}

function QuizPanel({ mode, setMode, onCorrect }) {
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
    }, 360);
  }

  const answerLabel = (item) => (mode === "kana-to-romaji" ? item.romaji : item.kana);
  const prompt = mode === "kana-to-romaji" ? question.current.kana : question.current.romaji;

  return (
    <article className="glass-card">
      <div className="row">
        <h3>Kana Drill</h3>
        <div className="row tight">
          <button className={`chip ${mode === "kana-to-romaji" ? "active" : ""}`} onClick={() => setMode("kana-to-romaji")}>Kana → Romaji</button>
          <button className={`chip ${mode === "romaji-to-kana" ? "active" : ""}`} onClick={() => setMode("romaji-to-kana")}>Romaji → Kana</button>
        </div>
      </div>
      <div className="question">{prompt}</div>
      <div className="caption">{question.current.set} • includes dakuten + handakuten</div>
      <div className="answer-grid">
        {question.choices.map((choice) => {
          const isCorrect = choice.kana === question.current.kana;
          const selectedWrong = answered === choice.kana;
          return (
            <button
              key={`${choice.kana}-${choice.set}`}
              className={`answer-btn ${answered === "correct" && isCorrect ? "good" : ""} ${selectedWrong ? "bad" : ""}`}
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
  const costs = [{ water: 2, sun: 1, fertilizer: 0 }, { water: 3, sun: 2, fertilizer: 0 }, { water: 4, sun: 2, fertilizer: 1 }];
  const STAGES = ["🌱", "🌿", "🌸", "🌺"];

  function onCorrect() {
    setResources((r) => ({ ...r, score: r.score + 1, water: r.water + 2, sun: r.sun + 1, fertilizer: r.fertilizer + (Math.random() > 0.7 ? 1 : 0) }));
  }

  function growTile(i) {
    const stage = garden[i];
    if (stage >= 3) return;
    const cost = costs[stage];
    if (resources.water < cost.water || resources.sun < cost.sun || resources.fertilizer < cost.fertilizer) return;
    const next = [...garden];
    next[i] = stage + 1;
    setGarden(next);
    setResources((r) => ({ ...r, water: r.water - cost.water, sun: r.sun - cost.sun, fertilizer: r.fertilizer - cost.fertilizer }));
  }

  return (
    <section className="page-grid">
      <QuizPanel mode={mode} setMode={setMode} onCorrect={onCorrect} />
      <article className="glass-card">
        <h3>Bloom Garden</h3>
        <div className="stats-wrap">
          <span>💧 {resources.water}</span><span>☀️ {resources.sun}</span><span>🧪 {resources.fertilizer}</span><span>Score {resources.score}</span>
        </div>
        <div className="tile-grid">
          {garden.map((stage, i) => (
            <button key={i} className="tile" onClick={() => growTile(i)}>
              <div>Plot {i + 1}</div>
              <div className="plant-emoji">{STAGES[stage]}</div>
              <small>{stage === 3 ? "Bloomed" : `${costs[Math.min(stage, 2)].water}💧 ${costs[Math.min(stage, 2)].sun}☀️ ${costs[Math.min(stage, 2)].fertilizer}🧪`}</small>
            </button>
          ))}
        </div>
      </article>
    </section>
  );
}

function GachaTab() {
  const [mode, setMode] = useState("kana-to-romaji");
  const spirits = useMemo(() => buildSpirits(), []);
  const [state, setState] = useLocalStorageState("jaala_gacha", { tickets: 0, pulls: 0, owned: {}, stardust: 0 });
  const [favorites, setFavorites] = useLocalStorageState("jaala_gacha_favorites", []);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [lastPull, setLastPull] = useState(null);

  const favoriteSet = useMemo(() => new Set(favorites), [favorites]);
  const visibleCollection = showFavoritesOnly ? spirits.filter((spirit) => favoriteSet.has(spirit.id)) : spirits;

  const stardustForRarity = (rarity) => (rarity === "epic" ? 24 : rarity === "rare" ? 9 : 3);

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
      const rarity = roll < 0.8 ? "common" : roll < 0.96 ? "rare" : "epic";
      const pool = spirits.filter((x) => x.rarity === rarity);
      const picked = pool[Math.floor(Math.random() * pool.length)];
      const prev = s.owned[picked.id] ?? 0;
      const dust = prev > 0 ? stardustForRarity(picked.rarity) : 0;
      setLastPull({ ...picked, dust, crafted: false });
      return { ...s, tickets: s.tickets - 1, pulls: s.pulls + 1, stardust: s.stardust + dust, owned: { ...s.owned, [picked.id]: prev + 1 } };
    });
  }

  function craftMissing() {
    setState((s) => {
      if (s.stardust < 150) return s;
      const missing = spirits.filter((spirit) => !(s.owned[spirit.id] > 0));
      if (missing.length < 1) return s;
      const picked = missing[Math.floor(Math.random() * missing.length)];
      setLastPull({ ...picked, dust: 0, crafted: true });
      return { ...s, stardust: s.stardust - 150, owned: { ...s.owned, [picked.id]: 1 } };
    });
  }

  return (
    <section className="page-grid">
      <QuizPanel mode={mode} setMode={setMode} onCorrect={onCorrect} />
      <article className="glass-card">
        <h3>Ethical Gacha Collection</h3>
        <div className="stats-wrap">
          <span>🎟️ {state.tickets}</span><span>✨ {state.stardust}</span><span>Pulls {state.pulls}</span><span>Owned {Object.values(state.owned).filter((n) => n > 0).length}/{spirits.length}</span>
        </div>
        <div className="row">
          <button className="chip active" onClick={pullOne} disabled={state.tickets < 1}>Use Ticket</button>
          <button className="chip" onClick={craftMissing} disabled={state.stardust < 150}>Craft Missing (150 ✨)</button>
          <label className="caption"><input type="checkbox" checked={showFavoritesOnly} onChange={(e) => setShowFavoritesOnly(e.target.checked)} /> My Favorites</label>
        </div>

        <div className={`pull-banner ${lastPull ? `rarity-${lastPull.rarity}` : ""}`}>
          {lastPull ? (
            <>
              <span className="pull-emoji">{lastPull.emoji}</span>
              <div>
                <div><b>{lastPull.name}</b> {lastPull.crafted ? "• crafted" : ""}</div>
                <div className="caption">{lastPull.vibe}</div>
                {lastPull.dust > 0 ? <div className="caption">Duplicate converted: +{lastPull.dust} stardust ✨</div> : null}
              </div>
            </>
          ) : "No pull yet"}
        </div>

        <div className="spirit-grid">
          {visibleCollection.map((spirit) => {
            const owned = state.owned[spirit.id] ?? 0;
            const unlocked = owned > 0;
            const fav = favoriteSet.has(spirit.id);
            return (
              <div key={spirit.id} className={`spirit-card rarity-${spirit.rarity} ${unlocked ? "" : "locked"}`}>
                <div className="row tight">
                  <span className="spirit-ico">{unlocked ? spirit.emoji : "❔"}</span>
                  <button className={`fav ${fav ? "on" : ""}`} onClick={() => toggleFavorite(spirit.id)}>💖</button>
                </div>
                <div className="spirit-name">{unlocked ? spirit.name : "Mystery Spirit"}</div>
                <div className="caption">{unlocked ? spirit.vibe : "Study more to unlock"}</div>
                <div className="caption">{spirit.rarity} • owned {owned}</div>
              </div>
            );
          })}
        </div>
      </article>
    </section>
  );
}

function CafeTab() {
  const [idx, setIdx] = useLocalStorageState("jaala_cafe_idx", 0);
  const [stars, setStars] = useLocalStorageState("jaala_cafe_stars", 0);
  const [brew, setBrew] = useState(0);
  const [choice, setChoice] = useState(null);
  const scene = CAFE_SCENES[idx % CAFE_SCENES.length];
  const options = useMemo(() => shuffle([scene.en, ...shuffle(CAFE_SCENES.filter((p) => p.en !== scene.en)).slice(0, 3).map((p) => p.en)]), [scene]);

  function pick(opt) {
    if (choice) return;
    const ok = opt === scene.en;
    setChoice(opt);
    setTimeout(() => {
      if (ok) setStars((s) => s + 1);
      setIdx((i) => i + 1);
      setChoice(null);
    }, 450);
  }

  return (
    <section className="page-grid">
      <article className="glass-card">
        <h3>Café Story</h3>
        <div className="cafe-stage">
          <div className="clerk">👩🏻‍🍳 {scene.clerk}</div>
          <div className="counter">☕ {scene.drink} + 🍰 {scene.sweet}</div>
          <button className="chip" onClick={() => setBrew((b) => Math.min(100, b + 20))}>Brew Sweet Set</button>
          <div className="hp-bar"><span style={{ width: `${brew}%` }} /></div>
        </div>
        <div className="question small">{scene.jp}</div>
        <div className="caption">{scene.romaji}</div>
      </article>

      <article className="glass-card">
        <h3>Translation Battle • ⭐ {stars}</h3>
        <div className="answer-list">
          {options.map((opt) => (
            <button key={opt} className={`answer-btn ${choice === opt && opt === scene.en ? "good" : ""} ${choice === opt && opt !== scene.en ? "bad" : ""}`} onClick={() => pick(opt)}>
              {opt}
            </button>
          ))}
        </div>
      </article>
    </section>
  );
}

function BossTab() {
  const [battle, setBattle] = useState({ playerHp: 100, bossHp: 120, input: "", current: KANA_POOL[0], log: "Choose attack!", done: false });
  const [activeBoss, setActiveBoss] = useState({ name: "Kitsune Warlord", emoji: "🦊" });
  const inputRef = useRef(null);

  function start(name, emoji) {
    const current = KANA_POOL[Math.floor(Math.random() * KANA_POOL.length)];
    setActiveBoss({ name, emoji });
    setBattle({ playerHp: 100, bossHp: 120, input: "", current, log: `${name} appeared!`, done: false });
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function attack() {
    if (battle.done) return;
    const typed = battle.input.trim().toLowerCase();
    const ok = typed === battle.current.romaji;
    const bossDmg = ok ? 22 : 0;
    const playerDmg = ok ? 4 : 16;
    const nextBoss = Math.max(0, battle.bossHp - bossDmg);
    const nextPlayer = Math.max(0, battle.playerHp - playerDmg);
    const nextKana = KANA_POOL[Math.floor(Math.random() * KANA_POOL.length)];
    const done = nextBoss <= 0 || nextPlayer <= 0;
    const log = done ? (nextBoss <= 0 ? "Victory! You defeated the boss!" : "Defeat! Train and retry!") : (ok ? `Critical hit! -${bossDmg}` : `Miss! You took -${playerDmg}`);
    setBattle({ playerHp: nextPlayer, bossHp: nextBoss, input: "", current: nextKana, log, done });
  }

  return (
    <article className="glass-card boss-card">
      <div className="row">
        <h3>Boss Duel Arena</h3>
        <div className="row tight">
          <button className="chip" onClick={() => start("Kitsune Warlord", "🦊")}>🦊 Fox</button>
          <button className="chip" onClick={() => start("Oni Commander", "👹")}>👹 Oni</button>
          <button className="chip" onClick={() => start("Dragon Empress", "🐉")}>🐉 Dragon</button>
        </div>
      </div>
      <div className="row">
        <div className="fighter">🧑‍🎓 You
          <div className="hp-bar"><span style={{ width: `${battle.playerHp}%` }} /></div>
        </div>
        <div className="fighter big">{activeBoss.emoji} {activeBoss.name}
          <div className="hp-bar enemy"><span style={{ width: `${(battle.bossHp / 120) * 100}%` }} /></div>
        </div>
      </div>
      <div className="question">{battle.current.kana}</div>
      <div className="row">
        <input ref={inputRef} className="battle-input" placeholder="Type romaji attack" value={battle.input} onChange={(e) => setBattle((b) => ({ ...b, input: e.target.value }))} onKeyDown={(e) => e.key === "Enter" && attack()} disabled={battle.done} />
        <button className="chip active" onClick={attack} disabled={battle.done}>Strike</button>
      </div>
      <div className="caption">{battle.log}</div>
    </article>
  );
}

export default function App() {
  const [tab, setTab] = useState("garden");
  const tabs = [
    { id: "garden", label: "Kana Garden" },
    { id: "gacha", label: "Ethical Gacha" },
    { id: "cafe", label: "Café VN" },
    { id: "boss", label: "Boss Duel" },
  ];

  return (
    <main className="app-root">
      <header className="hero">
        <div>
          <h1>Jaala’s Japanese Adventure ✨</h1>
          <p>
  I love you baby{" "}
  <span style={{ color: "#ff4d8d", fontWeight: 800 }}>❤️</span>. I built this little game just for you, so studying feels warm and fun. Full kana, Tokyo-to-Kyoto spirits, cozy café stories, and cinematic boss fights.
</p>

        </div>
      </header>
      <nav className="top-tabs">
        {tabs.map((t) => (
          <button key={t.id} className={`chip ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </nav>

      {tab === "garden" && <GardenTab />}
      {tab === "gacha" && <GachaTab />}
      {tab === "cafe" && <CafeTab />}
      {tab === "boss" && <BossTab />}
    </main>
  );
}
