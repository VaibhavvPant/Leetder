import {
  auraTitles,
  difficultyDescriptions,
  dramaFeed,
  problemCatalog,
  relationshipProfiles,
  topicSpotlights,
} from "./data.js";

const STORAGE_KEY = "leetder-mvp-state-v1";
const swipeThreshold = 120;
const topTopicsFallback = ["Graphs", "Binary Search", "Dynamic Programming", "Trees"];
const app = document.getElementById("app");

const allTopics = [...new Set(problemCatalog.flatMap((problem) => problem.tags))];

const defaultState = {
  seenIds: [],
  likedIds: [],
  passedIds: [],
  superLikedIds: [],
  matchedTopics: [],
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
  toast: {
    title: "Leetder Engine",
    body: "Swipe right, left, or super like to reveal your coding type.",
  },
};

const state = loadState();

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

function getDeck() {
  return problemCatalog
    .filter((problem) => !state.seenIds.includes(problem.id))
    .filter((problem) => {
      if (state.filters.difficulty !== "All" && problem.difficulty !== state.filters.difficulty) {
        return false;
      }

      if (state.filters.focusTopic !== "All" && !problem.tags.includes(state.filters.focusTopic)) {
        return false;
      }

      return true;
    })
    .sort((left, right) => computeScore(right) - computeScore(left));
}

function computeScore(problem) {
  const topicScore = problem.tags.reduce((sum, topic, index) => {
    const multiplier = index === 0 ? 2.35 : 1.15;
    return sum + state.topicScores[topic] * multiplier;
  }, 0);
  const difficultyScore = state.difficultyScores[problem.difficulty] * 2.5;
  const acceptanceScore = problem.acceptance > 55 ? 1.4 : 0.4;
  const challengeBonus = problem.difficulty === "Hard" && state.aura > 75 ? 5 : 0;
  const recencyPenalty = state.passedIds.includes(problem.id) ? 4 : 0;
  const focusBonus = state.filters.focusTopic !== "All" && problem.tags.includes(state.filters.focusTopic) ? 6 : 0;
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
  const leadTopic = next.tags[0];
  const vibe = topicSpotlights[leadTopic] || "clean pattern energy";
  return `Next up leans into ${leadTopic} because your recent swipes suggest a taste for ${vibe}.`;
}

function addFeed(title, body) {
  state.feed = [{ title, body }, ...state.feed].slice(0, 5);
}

function getDramaLine(action) {
  const bucket = dramaFeed[action];
  const index = Math.floor(Math.random() * bucket.length);
  return bucket[index];
}

function normalizeTopic(topic) {
  return topic === "Topological Sort" ? "Graphs" : topic;
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
  state.activeMatch = {
    topic,
    problemTitle: problem.title,
    compatibility: getCompatibility(topic),
    blurb: `${topic} noticed the pattern. Your queue is officially flirting back with this category.`,
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

function clearFilters() {
  state.filters = {
    difficulty: "All",
    focusTopic: "All",
  };
  saveState();
  render();
}

function closeMatch() {
  state.activeMatch = null;
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
  if (state.activeMatch) {
    return;
  }

  const deck = getDeck();
  const current = deck[0];
  if (!current) {
    return;
  }

  registerSwipe(action, current);
  render();
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

function render() {
  const deck = getDeck();
  const current = deck[0];
  const preview = deck.slice(1, 3);
  const favoriteTopic = getFavoriteTopic();
  const topTopics = getTopTopics();
  const likedProblems = getLikedProblems();
  const topicFilterOptions = [...new Set(["All", ...getTopTopics(6), state.filters.focusTopic])].filter(Boolean);
  const filtersActive = state.filters.difficulty !== "All" || state.filters.focusTopic !== "All";

  app.innerHTML = `
    <main class="shell">
      <section class="hero">
        <div class="hero-grid">
          <div>
            <span class="eyebrow">Leetder beta matchmaking engine</span>
            <h1>Swipe into your next coding obsession.</h1>
            <p>
              Discover LeetCode-style problems through a dating-app flow that learns your favorite
              topics, teases your avoidant phases, and serves better recommendations after every swipe.
            </p>
          </div>
          <div class="stat-row">
            <div class="stat-pill">
              <span class="stat-label">Coding aura</span>
              <span class="stat-value">${state.aura}%</span>
            </div>
            <div class="stat-pill">
              <span class="stat-label">Top topic</span>
              <span class="stat-value">${favoriteTopic || "Still evaluating"}</span>
            </div>
            <div class="stat-pill">
              <span class="stat-label">Queue left</span>
              <span class="stat-value">${deck.length}</span>
            </div>
            <div class="stat-pill">
              <span class="stat-label">Problems liked</span>
              <span class="stat-value">${state.likedIds.length}</span>
            </div>
          </div>
        </div>
      </section>

      <section class="panel">
        <div class="footer-row">
          <div>
            <h2>Mood Filters</h2>
            <p class="panel-subtitle">Tune the dating pool by difficulty and favorite pattern.</p>
          </div>
          <button class="ghost-btn" data-action="reset">Reset history</button>
        </div>
        <div class="filter-row" role="group" aria-label="Difficulty filters">
          ${["All", "Easy", "Medium", "Hard"]
            .map(
              (value) => `
                <button class="filter-btn ${state.filters.difficulty === value ? "is-active" : ""}" data-filter="difficulty" data-value="${value}">
                  ${value}
                </button>
              `,
            )
            .join("")}
        </div>
        <div class="filter-row" role="group" aria-label="Topic filters">
          ${topicFilterOptions
            .map(
              (value) => `
                <button class="filter-btn ${state.filters.focusTopic === value ? "is-active" : ""}" data-filter="topic" data-value="${value}">
                  ${value}
                </button>
              `,
            )
            .join("")}
        </div>
      </section>

      <section class="grid">
        <div class="column">
          <section class="panel">
            <h2>Compatibility Board</h2>
            <p class="panel-subtitle">Your strongest topic chemistry based on actual swipe behavior.</p>
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

          <section class="panel">
            <h2>Relationship Status</h2>
            <p class="panel-subtitle">${getRelationshipStatus()}</p>
            <div class="topic-list">
              <div class="topic-card">
                <strong>${getAuraLabel()}</strong>
                <small>Your aura changes with every like, skip, and commitment issue.</small>
              </div>
              <div class="topic-card">
                <strong>Recommendation Pulse</strong>
                <small>${getRecommendationCopy(deck)}</small>
              </div>
            </div>
          </section>
        </div>

        <section class="swipe-zone">
          <div class="swipe-topline">
            <div>
              <h2>Swipe Deck</h2>
              <p class="panel-subtitle">Drag left to skip, right to like, or use super like when the chemistry is obvious.</p>
            </div>
            <span class="chip is-active">Keyboard: left, right, up</span>
          </div>

          <div class="deck">
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
                  <div class="problem-card empty-state">
                    <h3>${filtersActive ? "No problems match these filters." : "No more unswiped problems."}</h3>
                    <p class="empty-copy">
                      ${
                        filtersActive
                          ? "Try clearing the filters to reopen the dating pool, or recycle your skipped set if you want a second chance arc."
                          : "You have exhausted the current recommendation pool. Recycle your skipped set or reset the whole situationship."
                      }
                    </p>
                    <div class="actions">
                      ${filtersActive ? '<button class="action-btn reject" data-action="clear-filters">Clear filters</button>' : ""}
                      <button class="action-btn super" data-action="recycle">Recycle skipped</button>
                      <button class="action-btn like" data-action="reset">Reset everything</button>
                    </div>
                  </div>
                `
            }
          </div>

          <div class="actions">
            <button class="action-btn reject" data-action="left">Left: skip it</button>
            <button class="action-btn super" data-action="super">Super Like</button>
            <button class="action-btn like" data-action="right">Right: solve later</button>
          </div>
          <div class="key-hint">Tip: drag the top card with your pointer for the full dating-app effect.</div>
        </section>

        <div class="column">
          <section class="panel">
            <h2>Damage Tracker</h2>
            <p class="panel-subtitle">How much rejection energy the algorithmic universe thinks you are carrying.</p>
            <div class="metric">
              <span class="metric-value">${state.emotionalDamage}%</span>
              <div class="bar"><span style="width: ${state.emotionalDamage}%"></span></div>
              <span class="meta-copy">
                ${
                  state.emotionalDamage > 60
                    ? "The app recommends touching a graph problem and breathing through it."
                    : "Manageable levels of heartbreak. You still have debugging charisma."
                }
              </span>
            </div>
          </section>

          <section class="panel">
            <h2>Recent Likes</h2>
            <p class="panel-subtitle">Problems the engine thinks you may actually come back to.</p>
            <div class="liked-list">
              ${
                likedProblems.length
                  ? likedProblems
                      .map(
                        (problem) => `
                          <div class="liked-item">
                            <strong>${problem.title}</strong>
                            <small>${problem.tags.join(" / ")} / ${problem.difficulty}</small>
                          </div>
                        `,
                      )
                      .join("")
                  : '<div class="liked-item"><strong>Nothing liked yet</strong><small>Your future favorite problem is still waiting on a right swipe.</small></div>'
              }
            </div>
          </section>

          <section class="panel">
            <h2>Drama Feed</h2>
            <p class="panel-subtitle">Every major turn in your algorithmic love life, serialized.</p>
            <div class="liked-list">
              ${state.feed
                .map(
                  (entry) => `
                    <div class="feed-item">
                      <strong>${entry.title}</strong>
                      <small>${entry.body}</small>
                    </div>
                  `,
                )
                .join("")}
            </div>
          </section>
        </div>
      </section>
    </main>

    ${
      state.toast
        ? `
          <aside class="toast">
            <div class="toast-title">${state.toast.title}</div>
            <div>${state.toast.body}</div>
          </aside>
        `
        : ""
    }

    ${
      state.activeMatch
        ? `
          <div class="modal" data-role="match-modal">
            <div class="modal-card">
              <span class="eyebrow">New match unlocked</span>
              <h3>${state.activeMatch.topic}</h3>
              <div class="match-head">
                <span class="chip is-active">${state.activeMatch.compatibility}% compatibility</span>
                <span class="chip">Triggered by ${state.activeMatch.problemTitle}</span>
              </div>
              <p>${state.activeMatch.blurb}</p>
              <div class="footer-row">
                <button class="action-btn like" data-action="close-match">Keep swiping</button>
              </div>
            </div>
          </div>
        `
        : ""
    }
  `;

  attachListeners(current);
}

function renderCard(problem, extraClass, isTopCard) {
  return `
    <article class="problem-card ${extraClass}" ${isTopCard ? 'data-role="top-card"' : ""}>
      <div class="card-header">
        <div>
          <div class="meta-line">
            <span class="mini-badge">Acceptance ${problem.acceptance}%</span>
            <span class="mini-badge">Suggested because you keep flirting with ${problem.tags[0]}</span>
          </div>
          <h3 class="problem-title">${problem.title}</h3>
        </div>
        <span class="difficulty-badge difficulty-${problem.difficulty}">${problem.difficulty}</span>
      </div>

      <div class="problem-body">
        <p class="problem-description">${problem.description}</p>
        <div class="hook">${problem.hook}</div>
        <div class="topic-list">
          <div class="meta-line">
            ${problem.tags.map((tag) => `<span class="tag">${tag}</span>`).join("")}
          </div>
        </div>
        <div class="queue-preview">
          <div class="queue-item">
            <span>Short pitch</span>
            <strong>${problem.tags[0]} / ${problem.difficulty}</strong>
          </div>
          <div class="queue-item">
            <span>Swipe result</span>
            <span class="queue-copy">Right teaches the engine, left cools the topic, super like boosts compatibility.</span>
          </div>
        </div>
      </div>
    </article>
  `;
}

function attachListeners(current) {
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
      if (action === "close-match") {
        closeMatch();
        return;
      }
      handleSwipe(action);
    });
  });

  document.querySelectorAll("[data-filter='difficulty']").forEach((button) => {
    button.addEventListener("click", () => setDifficultyFilter(button.dataset.value));
  });

  document.querySelectorAll("[data-filter='topic']").forEach((button) => {
    button.addEventListener("click", () => setTopicFilter(button.dataset.value));
  });

  if (current) {
    attachCardGesture(current);
  }
}

function attachCardGesture(current) {
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
    const rotation = deltaX / 18;
    card.style.transform = `translate(${deltaX}px, ${deltaY}px) rotate(${rotation}deg)`;
    card.style.opacity = `${clamp(1 - Math.abs(deltaX) / 360, 0.45, 1)}`;
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

    card.style.transition = "transform 220ms ease, opacity 220ms ease";
    card.style.transform = "";
    card.style.opacity = "";
  });

  card.addEventListener("pointercancel", () => {
    gesture.active = false;
    card.style.transition = "transform 220ms ease, opacity 220ms ease";
    card.style.transform = "";
    card.style.opacity = "";
  });
}

function animateCardExit(card, action) {
  const transforms = {
    left: "translate(-160%, 18px) rotate(-18deg)",
    right: "translate(160%, 18px) rotate(18deg)",
    super: "translate(0, -160%) rotate(6deg)",
  };

  card.style.transition = "transform 260ms ease, opacity 260ms ease";
  card.style.transform = transforms[action];
  card.style.opacity = "0";
  window.setTimeout(() => handleSwipe(action), 190);
}

window.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") {
    handleSwipe("left");
  }
  if (event.key === "ArrowRight") {
    handleSwipe("right");
  }
  if (event.key === "ArrowUp") {
    handleSwipe("super");
  }
  if (event.key === "Escape" && state.activeMatch) {
    closeMatch();
  }
});

render();
