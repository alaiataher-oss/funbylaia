/**
 * Higher or Lower — SEO-style estimated monthly search volumes.
 *
 * METHOD
 * - estMonthly: approximate global searches in the last 1 month
 *   (calibrated to public Semrush-scale keyword tiers + typical SEO long-tail ranges).
 * - score: log10-normalized 12–98 index used for gameplay comparisons.
 * - NOT official Google Ads / Trends / Keyword Planner data.
 * - Swap estMonthly later with Ahrefs / Semrush / Similarweb API exports.
 *
 * TIMEFRAME: last 1 month (rolling monthly estimate)
 */
export const VOLUME_META = {
  timeframe: "last_1_month",
  timeframeLabel: "last 1 month",
  source: "seo_estimate",
  sourceNote: "SEO-style estimates (Semrush-scale tiers). Not official Google data.",
};

export const SEARCH_QUERIES = [
  { q: "YouTube", estMonthly: 1380000000, score: 98 },
  { q: "ChatGPT", estMonthly: 1120000000, score: 96 },
  { q: "Instagram", estMonthly: 506000000, score: 90 },
  { q: "Weather today", estMonthly: 450000000, score: 89 },
  { q: "Amazon", estMonthly: 414000000, score: 88 },
  { q: "Translator", estMonthly: 400000000, score: 88 },
  { q: "Translate English to Spanish", estMonthly: 350000000, score: 87 },
  { q: "Gmail", estMonthly: 338000000, score: 86 },
  { q: "WhatsApp", estMonthly: 185000000, score: 81 },
  { q: "Google Maps", estMonthly: 185000000, score: 81 },
  { q: "Maps directions", estMonthly: 160000000, score: 80 },
  { q: "Pinterest", estMonthly: 151000000, score: 80 },
  { q: "TikTok", estMonthly: 124000000, score: 78 },
  { q: "Wordle", estMonthly: 110000000, score: 77 },
  { q: "Netflix", estMonthly: 101000000, score: 76 },
  { q: "Calculator", estMonthly: 68000000, score: 73 },
  { q: "Spotify", estMonthly: 68000000, score: 73 },
  { q: "LinkedIn", estMonthly: 68000000, score: 73 },
  { q: "News today", estMonthly: 55000000, score: 71 },
  { q: "Reddit", estMonthly: 55000000, score: 71 },
  { q: "Stranger Things", estMonthly: 55000000, score: 71 },
  { q: "iPhone", estMonthly: 45000000, score: 70 },
  { q: "Uber", estMonthly: 40000000, score: 69 },
  { q: "Twitch", estMonthly: 28000000, score: 66 },
  { q: "Zoom", estMonthly: 25000000, score: 65 },
  { q: "Tesla", estMonthly: 22000000, score: 64 },
  { q: "Minecraft", estMonthly: 20000000, score: 63 },
  { q: "Fortnite", estMonthly: 18000000, score: 62 },
  { q: "PlayStation", estMonthly: 16000000, score: 61 },
  { q: "Xbox", estMonthly: 14000000, score: 60 },
  { q: "Snapchat", estMonthly: 14000000, score: 60 },
  { q: "Taylor Swift", estMonthly: 12000000, score: 59 },
  { q: "Elon Musk", estMonthly: 11000000, score: 58 },
  { q: "Cristiano Ronaldo", estMonthly: 10000000, score: 57 },
  { q: "Harry Potter", estMonthly: 9000000, score: 57 },
  { q: "Star Wars", estMonthly: 8500000, score: 56 },
  { q: "BTS", estMonthly: 8000000, score: 56 },
  { q: "Beyoncé", estMonthly: 7500000, score: 55 },
  { q: "LeBron James", estMonthly: 7000000, score: 55 },
  { q: "Billie Eilish", estMonthly: 6500000, score: 54 },
  { q: "The Weeknd", estMonthly: 6000000, score: 53 },
  { q: "Bitcoin price", estMonthly: 5500000, score: 53 },
  { q: "Stock market today", estMonthly: 5000000, score: 52 },
  { q: "NBA scores", estMonthly: 4800000, score: 51 },
  { q: "Super Bowl", estMonthly: 4500000, score: 51 },
  { q: "World Cup", estMonthly: 4200000, score: 50 },
  { q: "Olympics", estMonthly: 3800000, score: 49 },
  { q: "AirPods", estMonthly: 3500000, score: 49 },
  { q: "Coffee near me", estMonthly: 3200000, score: 48 },
  { q: "Best pizza near me", estMonthly: 2800000, score: 47 },
  { q: "Cheap flights", estMonthly: 2500000, score: 46 },
  { q: "Gas prices near me", estMonthly: 2400000, score: 46 },
  { q: "Traffic near me", estMonthly: 2200000, score: 45 },
  { q: "What time is it", estMonthly: 2200000, score: 45 },
  { q: "Flight tracker", estMonthly: 2000000, score: 44 },
  { q: "Lottery results", estMonthly: 1800000, score: 43 },
  { q: "Horoscope today", estMonthly: 1600000, score: 42 },
  { q: "Dictionary", estMonthly: 1500000, score: 42 },
  { q: "Calendar", estMonthly: 1400000, score: 41 },
  { q: "Password generator", estMonthly: 1200000, score: 40 },
  { q: "Unit converter", estMonthly: 1100000, score: 39 },
  { q: "Time zone converter", estMonthly: 1000000, score: 38 },
  { q: "How to delete Instagram", estMonthly: 1000000, score: 38 },
  { q: "How to lose weight", estMonthly: 900000, score: 38 },
  { q: "How to reset password", estMonthly: 850000, score: 37 },
  { q: "Symptoms of flu", estMonthly: 800000, score: 37 },
  { q: "How to fall asleep", estMonthly: 750000, score: 36 },
  { q: "What is AI", estMonthly: 720000, score: 36 },
  { q: "How to get rich", estMonthly: 680000, score: 35 },
  { q: "Visa status check", estMonthly: 650000, score: 35 },
  { q: "How to cook rice", estMonthly: 620000, score: 35 },
  { q: "How to tie a tie", estMonthly: 550000, score: 34 },
  { q: "Recipe for cookies", estMonthly: 520000, score: 33 },
  { q: "How to make pasta", estMonthly: 500000, score: 33 },
  { q: "How to make coffee", estMonthly: 480000, score: 32 },
  { q: "How to make pancakes", estMonthly: 460000, score: 32 },
  { q: "How to boil an egg", estMonthly: 450000, score: 32 },
  { q: "How to hard boil eggs", estMonthly: 440000, score: 32 },
  { q: "How to do laundry", estMonthly: 420000, score: 31 },
  { q: "How to write a resume", estMonthly: 400000, score: 31 },
  { q: "How to invest money", estMonthly: 390000, score: 31 },
  { q: "How to learn English", estMonthly: 380000, score: 31 },
  { q: "How to calm anxiety", estMonthly: 370000, score: 30 },
  { q: "How to study better", estMonthly: 360000, score: 30 },
  { q: "How to stop overthinking", estMonthly: 350000, score: 30 },
  { q: "How to budget money", estMonthly: 340000, score: 30 },
  { q: "How to meditate", estMonthly: 330000, score: 29 },
  { q: "How to make friends", estMonthly: 320000, score: 29 },
  { q: "How to be more confident", estMonthly: 310000, score: 29 },
  { q: "How to stay motivated", estMonthly: 300000, score: 29 },
  { q: "How to fix WiFi", estMonthly: 290000, score: 28 },
  { q: "How to charge AirPods", estMonthly: 280000, score: 28 },
  { q: "How to quit my job", estMonthly: 280000, score: 28 },
  { q: "How to make fried rice", estMonthly: 270000, score: 28 },
  { q: "How to make brownies", estMonthly: 260000, score: 27 },
  { q: "How to make popcorn", estMonthly: 250000, score: 27 },
  { q: "Best books to read", estMonthly: 250000, score: 27 },
  { q: "How to make French toast", estMonthly: 240000, score: 27 },
  { q: "What is SEO", estMonthly: 240000, score: 27 },
  { q: "How to make a smoothie", estMonthly: 230000, score: 26 },
  { q: "Best laptop 2024", estMonthly: 220000, score: 26 },
  { q: "What is machine learning", estMonthly: 220000, score: 26 },
  { q: "How to make iced coffee", estMonthly: 220000, score: 26 },
  { q: "How to make pizza dough", estMonthly: 210000, score: 26 },
  { q: "Is water wet", estMonthly: 200000, score: 25 },
  { q: "How to make mashed potatoes", estMonthly: 200000, score: 25 },
  { q: "How to ask someone out", estMonthly: 200000, score: 25 },
  { q: "What is cloud computing", estMonthly: 200000, score: 25 },
  { q: "Eurovision", estMonthly: 200000, score: 25 },
  { q: "Why do we sneeze", estMonthly: 200000, score: 25 },
  { q: "How to remove makeup", estMonthly: 200000, score: 25 },
  { q: "How to make guacamole", estMonthly: 190000, score: 25 },
  { q: "How to apologize", estMonthly: 190000, score: 25 },
  { q: "How to make garlic bread", estMonthly: 180000, score: 24 },
  { q: "How to start a podcast", estMonthly: 180000, score: 24 },
  { q: "How to stop hiccups", estMonthly: 180000, score: 24 },
  { q: "What causes hiccups", estMonthly: 180000, score: 24 },
  { q: "Is Pluto a planet", estMonthly: 180000, score: 24 },
  { q: "How to make soup", estMonthly: 175000, score: 24 },
  { q: "How to build a habit", estMonthly: 170000, score: 24 },
  { q: "How to make lemonade", estMonthly: 170000, score: 24 },
  { q: "Why do cats purr", estMonthly: 170000, score: 24 },
  { q: "Why do leaves change color", estMonthly: 160000, score: 23 },
  { q: "How to start journaling", estMonthly: 160000, score: 23 },
  { q: "How to make hummus", estMonthly: 160000, score: 23 },
  { q: "Why do dogs bark", estMonthly: 160000, score: 23 },
  { q: "Is dark chocolate healthy", estMonthly: 160000, score: 23 },
  { q: "How to make iced tea", estMonthly: 155000, score: 23 },
  { q: "How to make iced matcha", estMonthly: 150000, score: 23 },
  { q: "How to take better photos", estMonthly: 150000, score: 23 },
  { q: "What is the metaverse", estMonthly: 150000, score: 23 },
  { q: "Are tomatoes fruit", estMonthly: 150000, score: 23 },
  { q: "Why do I yawn", estMonthly: 150000, score: 23 },
  { q: "Why do mosquitoes bite me", estMonthly: 150000, score: 23 },
  { q: "Do bees die after stinging", estMonthly: 150000, score: 23 },
  { q: "How to make ramen better", estMonthly: 145000, score: 23 },
  { q: "How to make scrambled eggs", estMonthly: 140000, score: 22 },
  { q: "How to organize my room", estMonthly: 140000, score: 22 },
  { q: "What is NFTs", estMonthly: 140000, score: 22 },
  { q: "Why do onions make you cry", estMonthly: 140000, score: 22 },
  { q: "Why do babies cry", estMonthly: 140000, score: 22 },
  { q: "Are eggs dairy", estMonthly: 140000, score: 22 },
  { q: "Do fish sleep", estMonthly: 140000, score: 22 },
  { q: "Is coffee good for you", estMonthly: 250000, score: 27 },
  { q: "What causes headaches", estMonthly: 350000, score: 30 },
  { q: "Why is the sky blue", estMonthly: 400000, score: 31 },
  { q: "Why am I always tired", estMonthly: 320000, score: 29 },
  { q: "Best TV shows right now", estMonthly: 300000, score: 29 },
  { q: "Marvel movies in order", estMonthly: 400000, score: 31 },
  { q: "Barbie movie", estMonthly: 350000, score: 30 },
  { q: "Avatar movie", estMonthly: 320000, score: 29 },
  { q: "Oppenheimer", estMonthly: 280000, score: 28 },
  { q: "SpongeBob", estMonthly: 450000, score: 32 },
  { q: "What is inflation", estMonthly: 280000, score: 28 },
  { q: "What is crypto", estMonthly: 260000, score: 27 },
  { q: "How to pack a suitcase", estMonthly: 130000, score: 22 },
  { q: "Why do phones get hot", estMonthly: 130000, score: 22 },
  { q: "Is honey vegan", estMonthly: 130000, score: 22 },
  { q: "How to wrap a gift", estMonthly: 120000, score: 21 },
  { q: "Why do ears pop", estMonthly: 120000, score: 21 },
  { q: "Can dogs eat bananas", estMonthly: 120000, score: 21 },
  { q: "Are spiders insects", estMonthly: 120000, score: 21 },
  { q: "Do sharks sleep", estMonthly: 120000, score: 21 },
  { q: "How to mute someone", estMonthly: 120000, score: 21 },
  { q: "How to fold clothes", estMonthly: 115000, score: 21 },
  { q: "How to fold a fitted sheet", estMonthly: 110000, score: 20 },
  { q: "How to unblock someone", estMonthly: 110000, score: 20 },
  { q: "Can cats eat chocolate", estMonthly: 110000, score: 20 },
  { q: "Is oatmeal gluten free", estMonthly: 110000, score: 20 },
  { q: "Why do my joints crack", estMonthly: 110000, score: 20 },
  { q: "How to change a tire", estMonthly: 105000, score: 20 },
  { q: "How to unclog a drain", estMonthly: 100000, score: 20 },
  { q: "How to whistle", estMonthly: 100000, score: 20 },
  { q: "How to set a sleep schedule", estMonthly: 100000, score: 20 },
  { q: "Can you eat raw cookie dough", estMonthly: 100000, score: 20 },
  { q: "Are bats blind", estMonthly: 100000, score: 20 },
  { q: "Do goldfish have memory", estMonthly: 100000, score: 20 },
  { q: "Why do batteries die", estMonthly: 100000, score: 20 },
  { q: "How to remove a splinter", estMonthly: 95000, score: 19 },
  { q: "Can you microwave metal", estMonthly: 95000, score: 19 },
  { q: "How to grow plants indoors", estMonthly: 95000, score: 19 },
  { q: "Do owls turn their heads 360", estMonthly: 95000, score: 19 },
  { q: "How to sew a button", estMonthly: 90000, score: 19 },
  { q: "How to wash white clothes", estMonthly: 90000, score: 19 },
  { q: "How to stop nail biting", estMonthly: 90000, score: 19 },
  { q: "How to make scrambled tofu", estMonthly: 90000, score: 19 },
  { q: "Why is my cat staring at me", estMonthly: 90000, score: 19 },
  { q: "What does DIY mean", estMonthly: 90000, score: 19 },
  { q: "Can parrots talk", estMonthly: 90000, score: 19 },
  { q: "Do snakes have ears", estMonthly: 90000, score: 19 },
  { q: "How to hang curtains", estMonthly: 85000, score: 18 },
  { q: "How to cut an avocado", estMonthly: 85000, score: 18 },
  { q: "Can humans drink seawater", estMonthly: 85000, score: 18 },
  { q: "How to iron a shirt", estMonthly: 80000, score: 18 },
  { q: "How to remove red wine stains", estMonthly: 80000, score: 18 },
  { q: "How to stretch before running", estMonthly: 80000, score: 18 },
  { q: "Can you train a cat", estMonthly: 80000, score: 18 },
  { q: "Is cereal soup", estMonthly: 80000, score: 18 },
  { q: "Do penguins have knees", estMonthly: 80000, score: 18 },
  { q: "Why do I get brain freeze", estMonthly: 80000, score: 18 },
  { q: "How to clean sneakers", estMonthly: 75000, score: 17 },
  { q: "How to peel garlic fast", estMonthly: 75000, score: 17 },
  { q: "How to clean a microwave", estMonthly: 70000, score: 17 },
  { q: "How to remove gum from hair", estMonthly: 70000, score: 17 },
  { q: "How to water succulents", estMonthly: 70000, score: 17 },
  { q: "Can you freeze cheese", estMonthly: 70000, score: 17 },
  { q: "Do koalas sleep a lot", estMonthly: 70000, score: 17 },
  { q: "How to clean eyeglasses", estMonthly: 65000, score: 16 },
  { q: "How to fix a zipper", estMonthly: 65000, score: 16 },
  { q: "Can turtles swim", estMonthly: 65000, score: 16 },
  { q: "How to clean a keyboard", estMonthly: 60000, score: 15 },
  { q: "How to open a coconut", estMonthly: 60000, score: 15 },
  { q: "Can rabbits eat grapes", estMonthly: 60000, score: 15 },
  { q: "How to clean cast iron", estMonthly: 55000, score: 15 },
  { q: "Can ducks fly", estMonthly: 55000, score: 15 },
  { q: "How to clean stainless steel", estMonthly: 50000, score: 14 },
  { q: "Can birds fly backwards", estMonthly: 50000, score: 14 },
  { q: "Can frogs jump backwards", estMonthly: 40000, score: 12 },
];

/** Prefer pairs that are interesting, not ridiculously obvious. */
export function buildRounds(count = 10) {
  const pool = [...SEARCH_QUERIES];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  const used = new Set();
  const rounds = [];
  let guard = 0;

  while (rounds.length < count && guard < 800) {
    guard += 1;
    const available = pool.filter((item) => !used.has(item.q));
    if (available.length < 2) break;

    const a = available[Math.floor(Math.random() * available.length)];
    const candidates = available.filter((b) => {
      if (b.q === a.q) return false;
      const diff = Math.abs(a.score - b.score);
      return diff >= 4 && diff <= 28;
    });
    const pickFrom = candidates.length ? candidates : available.filter((b) => b.q !== a.q);
    if (!pickFrom.length) continue;
    const b = pickFrom[Math.floor(Math.random() * pickFrom.length)];

    used.add(a.q);
    used.add(b.q);
    rounds.push(Math.random() < 0.5 ? [a, b] : [b, a]);
  }

  while (rounds.length < count) {
    const available = pool.filter((item) => !used.has(item.q));
    if (available.length < 2) break;
    const a = available[0];
    const b = available[1];
    used.add(a.q);
    used.add(b.q);
    rounds.push([a, b]);
  }

  return rounds;
}

