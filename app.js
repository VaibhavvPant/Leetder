import {
  auraTitles,
  difficultyDescriptions,
  dramaFeed,
  problemCatalog,
  relationshipProfiles,
  topicSpotlights,
} from "./data.js";

const STORAGE_KEY = "leetder-mvp-state-v2";
const swipeThreshold = 120;
const topTopicsFallback = ["Graphs", "Binary Search", "Dynamic Programming", "Trees"];
const navItems = [
  { id: "swipe", label: "Swipe", icon: "swipe" },
  { id: "matches", label: "Matches", icon: "heart" },
  { id: "profile", label: "Profile", icon: "user" },
  { id: "stats", label: "Stats", icon: "chart" },
];
const app = document.getElementById("app");

const allTopics = [...new Set(problemCatalog.flatMap((problem) => problem.tags.map(normalizeTopic)))];

const defaultState = {
  seenIds: [],
  likedIds: [],
  passedIds: [],
  superLikedIds: [],
  matchedTopics: [],
  matchHistory: [],
  topicScores: Object.fromEntries(allTopics.map((topic) => [topic, 0])),
  difficultyScores: { Easy: 0, Medium: 0, Hard: 0 },
  aura: 48,
  emotionalDamage: 8,
  filters: {
    difficulty: "All",
    focusTopic: "All",
  },
  feed: [
    {
      title: "Fresh Queue",
      body: "Your algorithmic dating pool is open. Swipe to train the recommendation engine.",
    },
  ],
  activeMatch: null,
  activeTab: "swipe",
  toast: {
    title: "Leetder Engine",
    body: "Swipe right, left, or super like to reveal your coding type.",
  },
};

const state = loadState();

function normalizeTopic(topic) {
  return topic === "Topological Sort" ? "Graphs" : topic;
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return structuredClone(defaultState);
    }

    const parsed = JSON.parse(raw);
    return {
      ...structuredClone(defaultState),
      ...parsed,
      topicScores: {
        ...defaultState.topicScores,
        ...(parsed.topicScores || {}),
      },
      difficultyScores: {
        ...defaultState.difficultyScores,
        ...(parsed.difficultyScores || {}),
      },
      filters: {
        ...defaultState.filters,
        ...(parsed.filters || {}),
      },
      feed: Array.isArray(parsed.feed) && parsed.feed.length ? parsed.feed : defaultState.feed,
      matchHistory: Array.isArray(parsed.matchHistory) ? parsed.matchHistory : [],
    };
  } catch (error) {
    console.warn("Unable to restore saved state", error);
    return structuredClone(defaultState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function hashString(value) {
  let hash = 0;
  for (const char of value) {
    hash = (hash * 31 + char.charCodeAt(0)) % 1000003;
  }
  return hash;
}

function formatCompactNumber(value) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 1,
  }).format(value);
}

function getSolvedCount(problem) {
  const base = { Easy: 820000, Medium: 540000, Hard: 250000 }[problem.difficulty];
  const seededSwing = hashString(problem.id) % 290000;
  const acceptanceBoost = Math.round(problem.acceptance * 1800);
  return base + seededSwing + acceptanceBoost;
}

function getDeck() {
  return problemCatalog
    .filter((problem) => !state.seenIds.includes(problem.id))
    .filter((problem) => {
      if (state.filters.difficulty !== "All" && problem.difficulty !== state.filters.difficulty) {
        return false;
      }

      if (state.filters.focusTopic !== "All") {
        const normalizedTags = problem.tags.map(normalizeTopic);
        if (!normalizedTags.includes(state.filters.focusTopic)) {
          return false;
        }
      }

      return true;
    })
    .sort((left, right) => computeScore(right) - computeScore(left));
}

function computeScore(problem) {
  const topicScore = problem.tags.reduce((sum, topic, index) => {
    const multiplier = index === 0 ? 2.35 : 1.15;
    return sum + (state.topicScores[normalizeTopic(topic)] || 0) * multiplier;
  }, 0);
  const difficultyScore = state.difficultyScores[problem.difficulty] * 2.5;
  const acceptanceScore = problem.acceptance > 55 ? 1.4 : 0.4;
  const challengeBonus = problem.difficulty === "Hard" && state.aura > 75 ? 5 : 0;
  const recencyPenalty = state.passedIds.includes(problem.id) ? 4 : 0;
  const focusBonus =
    state.filters.focusTopic !== "All" && problem.tags.map(normalizeTopic).includes(state.filters.focusTopic) ? 6 : 0;

  return topicScore + difficultyScore + acceptanceScore + challengeBonus + focusBonus - recencyPenalty;
}

function getFavoriteTopic() {
  const sorted = Object.entries(state.topicScores)
    .filter(([, score]) => score > 0)
    .sort((left, right) => right[1] - left[1]);

  return sorted[0]?.[0] || null;
}

function getCompatibility(topic) {
  const score = state.topicScores[topic] || 0;
  return clamp(Math.round(42 + score * 7 + state.superLikedIds.length * 2), 0, 99);
}

function getAuraLabel() {
  return auraTitles.find((entry) => state.aura <= entry.limit)?.label || auraTitles.at(-1).label;
}

function getRelationshipStatus() {
  const favoriteTopic = getFavoriteTopic();
  if (!favoriteTopic) {
    return "Single, observant, and still reading algorithm red flags.";
  }

  const profile = relationshipProfiles[favoriteTopic] || {
    calm: `${favoriteTopic} thinks there is real potential here.`,
    spicy: `${favoriteTopic} says your pattern preference is getting suspiciously obvious.`,
  };

  return state.emotionalDamage > 46 ? profile.spicy : profile.calm;
}

function getRecommendationCopy(deck) {
  if (!deck.length) {
    return "You emptied the queue. Either reset the pool or take this aura into a real contest.";
  }

  const next = deck[0];
  const leadTopic = normalizeTopic(next.tags[0]);
  const vibe = topicSpotlights[leadTopic] || "clean pattern energy";
  return `Next up leans into ${leadTopic} because your recent swipes suggest a taste for ${vibe}.`;
}

function addFeed(title, body) {
  state.feed = [{ title, body }, ...state.feed].slice(0, 6);
}

function getDramaLine(action) {
  const bucket = dramaFeed[action];
  const index = Math.floor(Math.random() * bucket.length);
  return bucket[index];
}

function getTopTopics(limit = 4) {
  const ranked = Object.entries(state.topicScores)
    .filter(([, score]) => score > -3)
    .sort((left, right) => right[1] - left[1])
    .slice(0, limit)
    .map(([topic]) => topic);

  return ranked.length ? ranked : topTopicsFallback.slice(0, limit);
}

function getLikedProblems(limit = 3) {
  return state.likedIds
    .slice()
    .reverse()
    .map((id) => problemCatalog.find((problem) => problem.id === id))
    .filter(Boolean)
    .slice(0, limit);
}

function getCurrentMatch() {
  if (state.activeMatch) {
    return state.activeMatch;
  }

  return state.matchHistory[0] || null;
}

function buildMatchReasons(topic, problem) {
  const curated = {
    "Binary Search": [
      "Both of you love divide and conquer energy.",
      "You keep choosing the middle path when pressure hits.",
      "Clean decision boundaries are your shared love language.",
    ],
    Graphs: [
      "You keep falling for messy systems with hidden structure.",
      "Traversal problems always pull you back in.",
      "You do not mind a little chaos if the pattern is real.",
    ],
    "Dynamic Programming": [
      "You romanticize state transitions more than most people should.",
      "Pattern recognition clearly counts as chemistry here.",
      "This match rewards patience, structure, and a little obsession.",
    ],
    Trees: [
      "Recursive family drama is somehow your comfort zone.",
      "You are weirdly calm around layered hierarchies.",
      "This match likes your depth-first emotional availability.",
    ],
  };

  if (curated[topic]) {
    return curated[topic];
  }

  const spotlight = topicSpotlights[topic] || "clean problem solving";
  return [
    `You keep swiping toward ${topic.toLowerCase()} problems.`,
    `This topic matches your taste for ${spotlight}.`,
    `${problem.title} confirmed the chemistry without forcing it.`,
  ];
}

function buildMatchPayload(topic, problem) {
  return {
    topic,
    problemTitle: problem.title,
    compatibility: getCompatibility(topic),
    blurb: `${topic} noticed the pattern. Your queue is officially flirting back with this category.`,
    reasons: buildMatchReasons(topic, problem),
    accent: topic.toLowerCase().replace(/\s+/g, "-"),
  };
}

function setDifficultyFilter(value) {
  state.filters.difficulty = value;
  saveState();
  render();
}

function setTopicFilter(value) {
  state.filters.focusTopic = value;
  saveState();
  render();
}

function setActiveTab(tab) {
  state.activeTab = tab;
  saveState();
  render();
}

function focusMatchTopic(topic) {
  state.filters.difficulty = "All";
  state.filters.focusTopic = topic;
  state.activeTab = "swipe";
  state.toast = {
    title: "Match Focus",
    body: `Filtering the deck for ${topic}. Go see where this situationship leads.`,
  };
  saveState();
  render();
}

function closeMatch() {
  state.activeTab = "swipe";
  saveState();
  render();
}

function selectMatch(topic) {
  const match = state.matchHistory.find((entry) => entry.topic === topic);
  if (!match) {
    return;
  }

  state.activeMatch = match;
  state.activeTab = "matches";
  saveState();
  render();
}

function clearFilters() {
  state.filters = {
    difficulty: "All",
    focusTopic: "All",
  };
  saveState();
  render();
}

function resetProgress() {
  Object.assign(state, structuredClone(defaultState));
  saveState();
  render();
}

function recycleSkipped() {
  state.seenIds = state.seenIds.filter((id) => state.likedIds.includes(id));
  state.passedIds = [];
  state.toast = {
    title: "Pool Refreshed",
    body: "Skipped problems are back in circulation. Character growth is optional.",
  };
  saveState();
  render();
}

function handleSwipe(action) {
  const deck = getDeck();
  const current = deck[0];
  if (!current) {
    return;
  }

  registerSwipe(action, current);
  render();
}

function registerSwipe(action, problem) {
  const topicBoost = action === "super" ? 3.8 : action === "right" ? 2 : -1.25;
  const difficultyBoost = action === "left" ? -0.6 : action === "super" ? 2.6 : 1.4;

  problem.tags.forEach((topic, index) => {
    const key = normalizeTopic(topic);
    const weightedBoost = index === 0 ? topicBoost : topicBoost * 0.8;
    state.topicScores[key] = clamp((state.topicScores[key] || 0) + weightedBoost, -10, 14);
  });

  state.difficultyScores[problem.difficulty] = clamp(
    state.difficultyScores[problem.difficulty] + difficultyBoost,
    -6,
    12,
  );

  if (!state.seenIds.includes(problem.id)) {
    state.seenIds.push(problem.id);
  }

  if (action === "left") {
    state.passedIds.push(problem.id);
    state.emotionalDamage = clamp(state.emotionalDamage + 7, 0, 100);
    state.aura = clamp(state.aura - 3, 0, 100);
  }

  if (action === "right") {
    state.likedIds.push(problem.id);
    state.aura = clamp(state.aura + 8, 0, 100);
    state.emotionalDamage = clamp(state.emotionalDamage - 2, 0, 100);
  }

  if (action === "super") {
    state.likedIds.push(problem.id);
    state.superLikedIds.push(problem.id);
    state.aura = clamp(state.aura + 12, 0, 100);
    state.emotionalDamage = clamp(state.emotionalDamage - 4, 0, 100);
  }

  const leadTopic = normalizeTopic(problem.tags[0]);
  maybeOpenMatch(leadTopic, problem, action);

  const titleMap = {
    left: "Swipe Left",
    right: "Liked Problem",
    super: "Super Like",
  };
  const explanation =
    action === "left"
      ? `${problem.title} was skipped. The engine will cool off on ${leadTopic} and ${problem.difficulty} for a while.`
      : `${problem.title} boosted your affinity for ${leadTopic} and tuned future recommendations toward ${difficultyDescriptions[problem.difficulty]}.`;

  addFeed(titleMap[action], explanation);
  state.toast = {
    title: titleMap[action],
    body: getDramaLine(action),
  };
  saveState();
}

function maybeOpenMatch(topic, problem, action) {
  const affinity = state.topicScores[topic] || 0;
  const alreadyMatched = state.matchedTopics.includes(topic);
  const shouldMatch = !alreadyMatched && (affinity >= 5 || action === "super");

  if (!shouldMatch) {
    return;
  }

  state.matchedTopics.push(topic);
  const match = buildMatchPayload(topic, problem);
  state.matchHistory = [match, ...state.matchHistory.filter((entry) => entry.topic !== topic)].slice(0, 8);
  state.activeMatch = match;
  state.activeTab = "matches";
}

function getDifficultyLabel(value) {
  return value === "All" ? "Any Level" : value.toUpperCase();
}

function getTopicLabel() {
  if (state.filters.focusTopic !== "All") {
    return state.filters.focusTopic;
  }

  return getFavoriteTopic() || "Open Pool";
}

function render() {
  const deck = getDeck();
  const current = deck[0];
  const preview = deck.slice(1, 3);
  const favoriteTopic = getFavoriteTopic();
  const topTopics = getTopTopics();
  const likedProblems = getLikedProblems(4);
  const currentMatch = getCurrentMatch();
  const topicFilterOptions = [...new Set(["All", ...getTopTopics(8), favoriteTopic, state.filters.focusTopic])].filter(Boolean);
  const content = {
    deck,
    current,
    preview,
    favoriteTopic,
    topTopics,
    likedProblems,
    currentMatch,
    topicFilterOptions,
  };

  app.innerHTML = `
    <main class="app-shell">
      <section class="phone-shell">
        <div class="phone-noise"></div>
        <div class="phone-glow phone-glow-a"></div>
        <div class="phone-glow phone-glow-b"></div>
        <div class="app-frame">
          <header class="app-header">
            <div class="brand-lockup">
              <span class="brand-mark">${renderIcon("flame")}</span>
              <div class="brand-copy">
                <strong>LeetCode</strong>
                <span>Tinder</span>
              </div>
            </div>
            <button class="avatar-button" data-action="open-profile" aria-label="Open profile">
              ${renderIcon("user")}
            </button>
          </header>

          <section class="screen-shell">
            ${renderActiveScreen(content)}
          </section>

          <nav class="bottom-nav" aria-label="Primary">
            ${navItems
              .map(
                (item) => `
                  <button
                    class="nav-button ${state.activeTab === item.id ? "is-active" : ""}"
                    data-tab="${item.id}"
                    aria-label="${item.label}"
                  >
                    <span class="nav-icon">${renderIcon(item.icon)}</span>
                    <span class="nav-label">${item.label}</span>
                  </button>
                `,
              )
              .join("")}
          </nav>
        </div>
      </section>
    </main>
  `;

  attachListeners();
  if (current && state.activeTab === "swipe") {
    attachCardGesture();
  }
}

function renderActiveScreen(content) {
  if (state.activeTab === "matches") {
    return renderMatchesScreen(content.currentMatch);
  }

  if (state.activeTab === "profile") {
    return renderProfileScreen(content.favoriteTopic, content.topicFilterOptions);
  }

  if (state.activeTab === "stats") {
    return renderStatsScreen(content.topTopics, content.likedProblems, content.deck);
  }

  return renderSwipeScreen(content.deck, content.current, content.preview);
}

function renderSwipeScreen(deck, current, preview) {
  const filtersActive = state.filters.difficulty !== "All" || state.filters.focusTopic !== "All";
  return `
    <section class="screen swipe-screen">
      <div class="screen-topline">
        <div class="status-chip-row">
          <span class="status-chip">${getDifficultyLabel(state.filters.difficulty)}</span>
          <span class="status-chip">${getTopicLabel()}</span>
          <span class="status-chip accent">Queue ${deck.length}</span>
        </div>
      </div>

      <div class="deck-shell">
        ${
          current
            ? `
              ${preview
                .slice()
                .reverse()
                .map((problem, index) => renderCard(problem, index === 0 ? "is-peek" : "is-far", false))
                .join("")}
              ${renderCard(current, "", true)}
            `
            : `
              <section class="problem-card empty-card">
                <div class="empty-copy-block">
                  <span class="empty-badge">${filtersActive ? "No Matches" : "All Swiped"}</span>
                  <h2>${filtersActive ? "No cards fit these filters." : "The deck is empty for now."}</h2>
                  <p>
                    ${
                      filtersActive
                        ? "Clear your current vibe filters or recycle skipped problems for a second chance."
                        : "Recycle skipped cards or reset the whole app if you want a fresh algorithmic dating pool."
                    }
                  </p>
                </div>
              </section>
            `
        }
      </div>

      <div class="action-dock">
        ${
          !current && filtersActive
            ? '<button class="action-pill" data-action="clear-filters">Clear filters</button>'
            : ""
        }
        ${
          !current
            ? `
              <button class="action-pill" data-action="recycle">Recycle skipped</button>
              <button class="action-pill secondary" data-action="reset">Reset everything</button>
            `
            : `
              <button class="round-action reject" data-action="left" aria-label="Skip problem">
                ${renderIcon("x")}
              </button>
              <button class="round-action super" data-action="super" aria-label="Super like problem">
                ${renderIcon("star")}
              </button>
              <button class="round-action like" data-action="right" aria-label="Like problem">
                ${renderIcon("heart")}
              </button>
            `
        }
      </div>

      <div class="message-bar">
        <div class="message-kicker">${state.toast.title}</div>
        <div class="message-copy">${state.toast.body}</div>
      </div>
    </section>
  `;
}

function renderMatchesScreen(match) {
  if (!match) {
    return `
      <section class="screen match-screen">
        <div class="match-panel empty-match">
          <span class="match-kicker">No Matches Yet</span>
          <h2>Swipe a few problems first.</h2>
          <p>The moment you commit to a topic hard enough, this screen turns into full algorithm romance.</p>
          <button class="primary-button" data-action="keep-swiping">Start Swiping</button>
        </div>
      </section>
    `;
  }

  return `
    <section class="screen match-screen">
      <div class="match-panel">
        <span class="match-kicker">New Match</span>
        <h2>It's a Match!</h2>
        <p class="match-copy">
          You and <strong>${match.topic}</strong> have <span>${match.compatibility}%</span> compatibility.
        </p>

        <div class="match-stage">
          <div class="match-orb you">
            <span>YOU</span>
          </div>
          <div class="match-heart">${renderIcon("heart")}</div>
          <div class="match-orb topic">
            <span>${match.topic}</span>
          </div>
        </div>

        <section class="reason-panel">
          <h3>Why you matched?</h3>
          <ul class="reason-list">
            ${match.reasons.map((reason) => `<li>${reason}</li>`).join("")}
          </ul>
        </section>

        <button class="primary-button" data-action="start-solving" data-topic="${match.topic}">Start Solving</button>
        <button class="secondary-button" data-action="keep-swiping">Keep Swiping</button>

        ${
          state.matchHistory.length > 1
            ? `
              <div class="match-history">
                ${state.matchHistory
                  .map(
                    (entry) => `
                      <button
                        class="match-chip ${entry.topic === match.topic ? "is-active" : ""}"
                        data-action="open-match"
                        data-topic="${entry.topic}"
                      >
                        ${entry.topic}
                      </button>
                    `,
                  )
                  .join("")}
              </div>
            `
            : ""
        }
      </div>
    </section>
  `;
}

function renderProfileScreen(favoriteTopic, topicFilterOptions) {
  return `
    <section class="screen profile-screen">
      <section class="profile-card">
        <div class="profile-avatar">VP</div>
        <div>
          <span class="match-kicker">Your Coding Type</span>
          <h2>${getAuraLabel()}</h2>
          <p>${getRelationshipStatus()}</p>
        </div>
      </section>

      <section class="info-card">
        <div class="stat-grid">
          <div class="stat-card">
            <span>Coding aura</span>
            <strong>${state.aura}%</strong>
          </div>
          <div class="stat-card">
            <span>Favorite topic</span>
            <strong>${favoriteTopic || "Still flirting"}</strong>
          </div>
          <div class="stat-card">
            <span>Emotional damage</span>
            <strong>${state.emotionalDamage}%</strong>
          </div>
          <div class="stat-card">
            <span>Likes saved</span>
            <strong>${state.likedIds.length}</strong>
          </div>
        </div>
      </section>

      <section class="info-card">
        <h3>Difficulty Preference</h3>
        <div class="chip-grid">
          ${["All", "Easy", "Medium", "Hard"]
            .map(
              (value) => `
                <button class="chip-button ${state.filters.difficulty === value ? "is-active" : ""}" data-filter="difficulty" data-value="${value}">
                  ${value}
                </button>
              `,
            )
            .join("")}
        </div>

        <h3>Topic Obsession</h3>
        <div class="chip-grid">
          ${topicFilterOptions
            .map(
              (value) => `
                <button class="chip-button ${state.filters.focusTopic === value ? "is-active" : ""}" data-filter="topic" data-value="${value}">
                  ${value}
                </button>
              `,
            )
            .join("")}
        </div>
      </section>

      <section class="info-card">
        <h3>Recommendation Pulse</h3>
        <p>${getRecommendationCopy(getDeck())}</p>
      </section>

      <div class="profile-actions">
        <button class="secondary-button" data-action="recycle">Recycle skipped</button>
        <button class="secondary-button danger" data-action="reset">Reset history</button>
      </div>
    </section>
  `;
}

function renderStatsScreen(topTopics, likedProblems, deck) {
  return `
    <section class="screen stats-screen">
      <section class="info-card">
        <div class="panel-heading">
          <h2>Compatibility</h2>
          <span>${topTopics[0] ? `${getCompatibility(topTopics[0])}% peak` : "Still calibrating"}</span>
        </div>
        <div class="compat-list">
          ${topTopics
            .map(
              (topic) => `
                <div class="compat-item">
                  <div class="compat-head">
                    <span>${topic}</span>
                    <strong>${getCompatibility(topic)}%</strong>
                  </div>
                  <div class="bar"><span style="width: ${getCompatibility(topic)}%"></span></div>
                </div>
              `,
            )
            .join("")}
        </div>
      </section>

      <section class="info-card">
        <div class="panel-heading">
          <h3>Signals</h3>
          <span>${deck.length} cards left</span>
        </div>
        <div class="stat-grid compact">
          <div class="stat-card">
            <span>Queue left</span>
            <strong>${deck.length}</strong>
          </div>
          <div class="stat-card">
            <span>Matches</span>
            <strong>${state.matchHistory.length}</strong>
          </div>
        </div>
      </section>

      <section class="info-card">
        <h3>Recent Likes</h3>
        <div class="list-stack">
          ${
            likedProblems.length
              ? likedProblems
                  .map(
                    (problem) => `
                      <article class="list-card">
                        <strong>${problem.title}</strong>
                        <small>${problem.tags.map(normalizeTopic).join(" / ")} / ${problem.difficulty}</small>
                      </article>
                    `,
                  )
                  .join("")
              : '<article class="list-card"><strong>Nothing liked yet</strong><small>Your future favorite is still in the deck.</small></article>'
          }
        </div>
      </section>

      <section class="info-card">
        <h3>Drama Feed</h3>
        <div class="list-stack">
          ${state.feed
            .map(
              (entry) => `
                <article class="list-card">
                  <strong>${entry.title}</strong>
                  <small>${entry.body}</small>
                </article>
              `,
            )
            .join("")}
        </div>
      </section>
    </section>
  `;
}

function renderCard(problem, extraClass, isTopCard) {
  return `
    <article class="problem-card ${extraClass}" ${isTopCard ? 'data-role="top-card"' : ""}>
      <div class="card-backdrop"></div>
      <div class="swipe-stamp stamp-left">NOPE</div>
      <div class="swipe-stamp stamp-right">LIKE</div>
      <div class="swipe-stamp stamp-up">TOP PICK</div>

      <div class="card-topline">
        <span class="difficulty-word difficulty-${problem.difficulty}">${problem.difficulty.toUpperCase()}</span>
        <div class="tag-row">
          ${problem.tags
            .slice(0, 3)
            .map((tag) => `<span class="tag-pill">${normalizeTopic(tag)}</span>`)
            .join("")}
        </div>
      </div>

      <div class="card-copy">
        <h2 class="problem-title">${problem.title}</h2>
        <p class="problem-description">${problem.description}</p>
      </div>

      <div class="hook-card">${problem.hook}</div>

      <div class="card-footer">
        <div class="footer-metric">
          <span>Solved by</span>
          <strong>${formatCompactNumber(getSolvedCount(problem))}</strong>
        </div>
        <div class="footer-metric align-right">
          <span>Success Rate</span>
          <strong>${problem.acceptance}%</strong>
        </div>
      </div>
    </article>
  `;
}

function renderIcon(name) {
  const icons = {
    flame:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2c.8 2.5-.4 4.4-2 6.1C8.6 9.7 8 11 8 12.5A4 4 0 0 0 12 16a4 4 0 0 0 4-3.5c.1-1.8-.7-3.3-2.1-4.7-.6 1.4-1.7 2.4-3.1 3.1.5-1.5.4-3-.8-4.8C8.7 7.1 7 9.5 7 12.6A5 5 0 0 0 12 18a5 5 0 0 0 5-5.1c0-3.4-1.7-6.4-5-10.9Z" fill="currentColor"/></svg>',
    user:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 12a4.25 4.25 0 1 0 0-8.5A4.25 4.25 0 0 0 12 12Zm0 2c-4.2 0-7.5 2.3-7.5 5.2V21h15v-1.8C19.5 16.3 16.2 14 12 14Z" fill="currentColor"/></svg>',
    x:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6.7 5.3 5.3 5.3 5.3-5.3 1.4 1.4-5.3 5.3 5.3 5.3-1.4 1.4-5.3-5.3-5.3 5.3-1.4-1.4 5.3-5.3-5.3-5.3 1.4-1.4Z" fill="currentColor"/></svg>',
    star:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2.8 2.7 5.4 6 .9-4.3 4.2 1 6-5.4-2.8-5.4 2.8 1-6-4.3-4.2 6-.9L12 2.8Z" fill="currentColor"/></svg>',
    heart:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.3 4.5 12.8a4.9 4.9 0 0 1 0-6.9 4.8 4.8 0 0 1 6.8 0L12 6.6l.7-.7a4.8 4.8 0 0 1 6.8 0 4.9 4.9 0 0 1 0 6.9L12 20.3Z" fill="currentColor"/></svg>',
    swipe:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 15c2.8-1.6 5.2-2.4 7.2-2.4 1.7 0 3.2.5 4.5 1.6V9.8l4.3 4.2-4.3 4.2v-3c-1.1-.9-2.4-1.3-3.8-1.3-1.8 0-4 .8-6.8 2.4L4 15Z" fill="currentColor"/></svg>',
    chart:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 20V9.5h3V20H5Zm5.5 0V4h3v16h-3Zm5.5 0v-7h3v7h-3Z" fill="currentColor"/></svg>',
  };

  return icons[name];
}

function attachListeners() {
  document.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.action;

      if (action === "reset") {
        resetProgress();
        return;
      }

      if (action === "recycle") {
        recycleSkipped();
        return;
      }

      if (action === "clear-filters") {
        clearFilters();
        return;
      }

      if (action === "keep-swiping" || action === "close-match") {
        closeMatch();
        return;
      }

      if (action === "start-solving") {
        focusMatchTopic(button.dataset.topic);
        return;
      }

      if (action === "open-profile") {
        setActiveTab("profile");
        return;
      }

      if (action === "open-match") {
        selectMatch(button.dataset.topic);
        return;
      }

      triggerSwipeAction(action);
    });
  });

  document.querySelectorAll("[data-tab]").forEach((button) => {
    button.addEventListener("click", () => setActiveTab(button.dataset.tab));
  });

  document.querySelectorAll("[data-filter='difficulty']").forEach((button) => {
    button.addEventListener("click", () => setDifficultyFilter(button.dataset.value));
  });

  document.querySelectorAll("[data-filter='topic']").forEach((button) => {
    button.addEventListener("click", () => setTopicFilter(button.dataset.value));
  });
}

function triggerSwipeAction(action) {
  const card = document.querySelector("[data-role='top-card']");
  if (!card || state.activeTab !== "swipe") {
    handleSwipe(action);
    return;
  }

  updateSwipePreview(card, action === "right" ? 180 : action === "left" ? -180 : 0, action === "super" ? -180 : 0);
  animateCardExit(card, action);
}

function attachCardGesture() {
  const card = document.querySelector("[data-role='top-card']");
  if (!card) {
    return;
  }

  const gesture = {
    active: false,
    startX: 0,
    startY: 0,
  };

  card.addEventListener("pointerdown", (event) => {
    gesture.active = true;
    gesture.startX = event.clientX;
    gesture.startY = event.clientY;
    card.setPointerCapture(event.pointerId);
    card.style.transition = "none";
  });

  card.addEventListener("pointermove", (event) => {
    if (!gesture.active) {
      return;
    }

    const deltaX = event.clientX - gesture.startX;
    const deltaY = event.clientY - gesture.startY;
    const rotation = deltaX / 16;

    card.style.transform = `translate(${deltaX}px, ${deltaY}px) rotate(${rotation}deg)`;
    card.style.opacity = `${clamp(1 - Math.abs(deltaX) / 360, 0.45, 1)}`;
    updateSwipePreview(card, deltaX, deltaY);
  });

  card.addEventListener("pointerup", (event) => {
    if (!gesture.active) {
      return;
    }

    gesture.active = false;
    const deltaX = event.clientX - gesture.startX;
    const deltaY = event.clientY - gesture.startY;
    card.releasePointerCapture(event.pointerId);

    if (deltaX >= swipeThreshold) {
      animateCardExit(card, "right");
      return;
    }

    if (deltaX <= -swipeThreshold) {
      animateCardExit(card, "left");
      return;
    }

    if (deltaY <= -110) {
      animateCardExit(card, "super");
      return;
    }

    clearSwipePreview(card);
    card.style.transition = "transform 220ms ease, opacity 220ms ease";
    card.style.transform = "";
    card.style.opacity = "";
  });

  card.addEventListener("pointercancel", () => {
    gesture.active = false;
    clearSwipePreview(card);
    card.style.transition = "transform 220ms ease, opacity 220ms ease";
    card.style.transform = "";
    card.style.opacity = "";
  });
}

function updateSwipePreview(card, deltaX, deltaY) {
  const stamps = {
    left: card.querySelector(".stamp-left"),
    right: card.querySelector(".stamp-right"),
    up: card.querySelector(".stamp-up"),
  };

  stamps.left?.classList.toggle("is-visible", deltaX < -45);
  stamps.right?.classList.toggle("is-visible", deltaX > 45);
  stamps.up?.classList.toggle("is-visible", deltaY < -70 && Math.abs(deltaX) < 120);
}

function clearSwipePreview(card) {
  card.querySelectorAll(".swipe-stamp").forEach((stamp) => {
    stamp.classList.remove("is-visible");
  });
}

function animateCardExit(card, action) {
  const transforms = {
    left: "translate(-170%, 30px) rotate(-22deg)",
    right: "translate(170%, 30px) rotate(22deg)",
    super: "translate(0, -170%) rotate(8deg)",
  };

  card.style.transition = "transform 280ms ease, opacity 280ms ease";
  card.style.transform = transforms[action];
  card.style.opacity = "0";
  window.setTimeout(() => handleSwipe(action), 200);
}

window.addEventListener("keydown", (event) => {
  if (state.activeTab !== "swipe") {
    if (event.key === "Escape" && state.activeTab === "matches") {
      closeMatch();
    }
    return;
  }

  if (event.key === "ArrowLeft") {
    triggerSwipeAction("left");
  }

  if (event.key === "ArrowRight") {
    triggerSwipeAction("right");
  }

  if (event.key === "ArrowUp") {
    triggerSwipeAction("super");
  }
});

render();
