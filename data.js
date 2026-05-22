export const problemCatalog = [
  {
    id: "two-sum",
    title: "Two Sum",
    difficulty: "Easy",
    acceptance: 54.3,
    tags: ["Arrays", "Hash Map"],
    hook: "Classic first date energy. Simple prompt, sneaky chemistry.",
    description:
      "Find two indices whose values add up to a target without reusing the same element.",
  },
  {
    id: "binary-search",
    title: "Binary Search",
    difficulty: "Easy",
    acceptance: 59.1,
    tags: ["Binary Search"],
    hook: "Minimalist, efficient, and weirdly attractive under pressure.",
    description:
      "Search a sorted array in logarithmic time and stop doom-scrolling halfway through.",
  },
  {
    id: "number-of-islands",
    title: "Number of Islands",
    difficulty: "Medium",
    acceptance: 61.4,
    tags: ["Graphs", "DFS", "BFS"],
    hook: "A beach episode, but every island is a traversal problem.",
    description:
      "Count connected land components in a grid using traversal to avoid getting lost at sea.",
  },
  {
    id: "longest-increasing-subsequence",
    title: "Longest Increasing Subsequence",
    difficulty: "Medium",
    acceptance: 57.2,
    tags: ["Dynamic Programming", "Binary Search"],
    hook: "Slow-burn romance for people who sort feelings into states.",
    description:
      "Track the longest strictly increasing subsequence with a dynamic approach or a clever binary-search trick.",
  },
  {
    id: "lowest-common-ancestor",
    title: "Lowest Common Ancestor of a Binary Tree",
    difficulty: "Medium",
    acceptance: 66.9,
    tags: ["Trees", "DFS"],
    hook: "Family reunion drama, but with pointers and recursion.",
    description:
      "Find the shared ancestor of two nodes in a binary tree without turning the lineage into chaos.",
  },
  {
    id: "koko-eating-bananas",
    title: "Koko Eating Bananas",
    difficulty: "Medium",
    acceptance: 49.8,
    tags: ["Binary Search"],
    hook: "Operational research disguised as snack management.",
    description:
      "Choose the minimum eating speed that lets Koko finish every pile before the deadline.",
  },
  {
    id: "course-schedule",
    title: "Course Schedule",
    difficulty: "Medium",
    acceptance: 49.4,
    tags: ["Graphs", "Topological Sort"],
    hook: "Commitment issues, but for prerequisite chains.",
    description:
      "Detect whether a course dependency graph contains a cycle before your semester implodes.",
  },
  {
    id: "house-robber",
    title: "House Robber",
    difficulty: "Medium",
    acceptance: 52.6,
    tags: ["Dynamic Programming"],
    hook: "A morally questionable way to learn recurrence relations.",
    description:
      "Maximize the stolen amount while avoiding adjacent houses and obvious felony patterns.",
  },
  {
    id: "rotting-oranges",
    title: "Rotting Oranges",
    difficulty: "Medium",
    acceptance: 52.3,
    tags: ["Graphs", "BFS"],
    hook: "Apocalypse logistics with a timer and a queue.",
    description:
      "Measure how long a contagion takes to spread through a grid of fresh oranges.",
  },
  {
    id: "jump-game",
    title: "Jump Game",
    difficulty: "Medium",
    acceptance: 40.2,
    tags: ["Greedy", "Arrays"],
    hook: "Trust fall into the nearest optimal choice.",
    description:
      "Figure out whether you can reach the last index by greedily extending your range.",
  },
  {
    id: "subarray-sum-equals-k",
    title: "Subarray Sum Equals K",
    difficulty: "Medium",
    acceptance: 45.7,
    tags: ["Arrays", "Prefix Sum", "Hash Map"],
    hook: "Prefix sums: because raw intuition needed structure.",
    description:
      "Count continuous subarrays whose values total a target using cumulative sums and frequency tracking.",
  },
  {
    id: "merge-k-sorted-lists",
    title: "Merge k Sorted Lists",
    difficulty: "Hard",
    acceptance: 56.7,
    tags: ["Linked List", "Heap"],
    hook: "Messy group chat, elegant priority queue.",
    description:
      "Merge multiple sorted linked lists efficiently instead of repeatedly doing emotional O(nk) work.",
  },
  {
    id: "serialize-tree",
    title: "Serialize and Deserialize Binary Tree",
    difficulty: "Hard",
    acceptance: 59.4,
    tags: ["Trees", "BFS", "DFS"],
    hook: "Long-distance relationship between memory and storage.",
    description:
      "Convert a tree to a string and back again without losing structure or causing existential drift.",
  },
  {
    id: "sliding-window-maximum",
    title: "Sliding Window Maximum",
    difficulty: "Hard",
    acceptance: 46.1,
    tags: ["Deque", "Sliding Window"],
    hook: "Peak performance, one window at a time.",
    description:
      "Return the maximum value in each moving window by maintaining a monotonic deque.",
  },
  {
    id: "trapping-rain-water",
    title: "Trapping Rain Water",
    difficulty: "Hard",
    acceptance: 64.2,
    tags: ["Two Pointers", "Stack"],
    hook: "A hydration puzzle with commitment to edge cases.",
    description:
      "Compute how much water can be trapped between elevations using boundary logic instead of vibes.",
  },
  {
    id: "median-sorted-arrays",
    title: "Median of Two Sorted Arrays",
    difficulty: "Hard",
    acceptance: 42.7,
    tags: ["Binary Search", "Arrays"],
    hook: "Intimidating profile, elite conversationalist.",
    description:
      "Partition two sorted arrays correctly to find the median in logarithmic time.",
  },
];

export const dramaFeed = {
  left: [
    "Dynamic Programming says the timing was off and the recursion got too real.",
    "Greedy accepted the rejection but still took the locally optimal exit.",
    "Graphs is pretending not to care while silently traversing your pattern.",
    "Binary Search only needed one midpoint to decide this was not the move.",
  ],
  right: [
    "The compiler blushes. This one might actually make it to your solved list.",
    "Your coding aura just picked up real signal.",
    "A clean match with potential. Complexity chat begins immediately.",
    "This swipe had strong interview arc energy.",
  ],
  super: [
    "That was a full-send commitment. Topic chemistry detected.",
    "The algorithmic group chat is already talking about this super like.",
    "You just skipped subtlety and chose pure compatibility.",
    "Mutual obsession with this pattern has been logged.",
  ],
};

export const relationshipProfiles = {
  Arrays: {
    calm: "Arrays wants something casual, fast, and index-addressable.",
    spicy: "Arrays says you keep returning after every rebound.",
  },
  "Binary Search": {
    calm: "Binary Search likes your boundaries and respects your logarithmic pace.",
    spicy: "Binary Search says half your problems disappear when you finally commit.",
  },
  Graphs: {
    calm: "Graphs sees long-term potential with a side of traversal chaos.",
    spicy: "Graphs says you keep ghosting after one BFS and calling it growth.",
  },
  "Dynamic Programming": {
    calm: "Dynamic Programming wants exclusivity, memoization, and emotional stability.",
    spicy: "Dynamic Programming says you are avoidant until someone mentions state transitions.",
  },
  Trees: {
    calm: "Trees is impressed that you can handle layered family structure.",
    spicy: "Trees says your attachment style is recursively defined.",
  },
  Greedy: {
    calm: "Greedy is fun now, but it keeps asking whether this is globally optimal.",
    spicy: "Greedy says you chase immediate wins and call it destiny.",
  },
};

export const auraTitles = [
  { limit: 35, label: "Syntax Situationship" },
  { limit: 55, label: "Runtime Flirt" },
  { limit: 75, label: "Complexity Charmer" },
  { limit: 90, label: "Pattern Magnet" },
  { limit: 101, label: "Interview Final Boss" },
];

export const topicSpotlights = {
  Arrays: "low-ceremony speed",
  "Binary Search": "clean decision boundaries",
  Graphs: "messy systems with hidden structure",
  "Dynamic Programming": "deep pattern recognition",
  Trees: "hierarchy and recursion",
  Greedy: "confident shortcuts",
  BFS: "level-headed exploration",
  DFS: "dive-first curiosity",
  "Topological Sort": "dependency drama",
  "Prefix Sum": "quiet preparation",
  Heap: "priority management",
  "Sliding Window": "focused iteration",
};

export const difficultyDescriptions = {
  Easy: "warming up and farming quick confidence",
  Medium: "chasing that sweet spot of challenge",
  Hard: "romanticizing pain in exchange for growth",
};
