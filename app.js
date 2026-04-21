const STORAGE_KEY = "friends-quiz-night-state-v3";

const elements = {
  setupPanel: document.querySelector("#setupPanel"),
  gamePanel: document.querySelector("#gamePanel"),
  gamePhasePill: document.querySelector("#gamePhasePill"),
  playerNames: document.querySelector("#playerNames"),
  teamSize: document.querySelector("#teamSize"),
  teamPreview: document.querySelector("#teamPreview"),
  questionList: document.querySelector("#questionList"),
  questionTemplate: document.querySelector("#questionTemplate"),
  setupMessage: document.querySelector("#setupMessage"),
  currentTeamName: document.querySelector("#currentTeamName"),
  roundLabel: document.querySelector("#roundLabel"),
  pointsInPlay: document.querySelector("#pointsInPlay"),
  questionPrompt: document.querySelector("#questionPrompt"),
  questionHint: document.querySelector("#questionHint"),
  questionAnswer: document.querySelector("#questionAnswer"),
  questionNumberLabel: document.querySelector("#questionNumberLabel"),
  hintBox: document.querySelector("#hintBox"),
  answerBox: document.querySelector("#answerBox"),
  turnMessage: document.querySelector("#turnMessage"),
  winnerBanner: document.querySelector("#winnerBanner"),
  winnerTitle: document.querySelector("#winnerTitle"),
  winnerSubtitle: document.querySelector("#winnerSubtitle"),
  leaderboard: document.querySelector("#leaderboard"),
  turnOrder: document.querySelector("#turnOrder"),
  eventLog: document.querySelector("#eventLog"),
  generateTeamsBtn: document.querySelector("#generateTeamsBtn"),
  addQuestionBtn: document.querySelector("#addQuestionBtn"),
  startGameBtn: document.querySelector("#startGameBtn"),
  resetGameBtn: document.querySelector("#resetGameBtn"),
  correctBtn: document.querySelector("#correctBtn"),
  incorrectBtn: document.querySelector("#incorrectBtn"),
  passBtn: document.querySelector("#passBtn"),
  revealHintBtn: document.querySelector("#revealHintBtn"),
  nextQuestionBtn: document.querySelector("#nextQuestionBtn"),
  quizFileInput: document.querySelector("#quizFileInput"),
  loadFileBtn: document.querySelector("#loadFileBtn"),
  clearQuestionsBtn: document.querySelector("#clearQuestionsBtn"),
  fileStatus: document.querySelector("#fileStatus"),
};

const state = {
  stage: "setup",
  draft: {
    playerNames: "",
    teamSize: 2,
    loadedQuizName: "",
  },
  teams: [],
  questions: [],
  logs: [],
  game: null,
};

function saveState() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      stage: state.stage,
      draft: state.draft,
      teams: state.teams,
      questions: state.questions,
      logs: state.logs,
      game: state.game,
    })
  );
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return;
  }

  try {
    const parsed = JSON.parse(raw);
    state.stage = parsed.stage || "setup";
    state.draft = {
      playerNames: parsed.draft?.playerNames || "",
      teamSize: parsed.draft?.teamSize || 2,
      loadedQuizName: parsed.draft?.loadedQuizName || "",
    };
    state.teams = parsed.teams || [];
    state.questions = parsed.questions || [];
    state.logs = parsed.logs || [];
    state.game = parsed.game || null;
  } catch (error) {
    console.warn("Failed to restore saved state", error);
  }
}

function seededTeamName(index) {
  return `Team ${index + 1}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function shuffle(items) {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
}

function parsePlayers() {
  return elements.playerNames.value
    .split("\n")
    .map((value) => value.trim())
    .filter(Boolean);
}

function createTeamsFromPlayers(players, teamSize) {
  const shuffled = shuffle(players);
  const createdTeams = [];

  shuffled.forEach((player, index) => {
    const teamIndex = Math.floor(index / teamSize);

    if (!createdTeams[teamIndex]) {
      createdTeams[teamIndex] = {
        id: crypto.randomUUID(),
        name: seededTeamName(teamIndex),
        players: [],
        score: 0,
      };
    }

    createdTeams[teamIndex].players.push(player);
  });

  return createdTeams;
}

function validateTeamSetup(players, teamSize) {
  if (!players.length || !teamSize) {
    return "Add players and a valid team size first.";
  }

  const projectedTeamCount = Math.ceil(players.length / teamSize);

  if (projectedTeamCount < 2) {
    return "Use enough players or a smaller team size so the quiz has at least 2 teams.";
  }

  return "";
}

function syncAllQuestionTitles() {
  [...elements.questionList.querySelectorAll(".question-editor")].forEach(
    (editor, index) => {
      editor.querySelector(".question-title").textContent = `Question ${index + 1}`;
    }
  );
}

function addQuestionEditor(question = { prompt: "", hint: "", answer: "" }) {
  const fragment = elements.questionTemplate.content.cloneNode(true);
  const editor = fragment.querySelector(".question-editor");
  const promptInput = fragment.querySelector(".question-prompt");
  const hintInput = fragment.querySelector(".question-hint");
  const answerInput = fragment.querySelector(".question-answer");
  const removeButton = fragment.querySelector(".remove-link");

  promptInput.value = question.prompt || "";
  hintInput.value = question.hint || "";
  answerInput.value = question.answer || "";

  removeButton.addEventListener("click", () => {
    editor.remove();
    ensureAtLeastOneQuestionEditor();
    syncAllQuestionTitles();
    persistSetupDraft();
  });

  [promptInput, hintInput, answerInput].forEach((input) => {
    input.addEventListener("input", () => {
      state.draft.loadedQuizName = "";
      updateFileStatus();
      persistSetupDraft();
    });
  });

  elements.questionList.appendChild(fragment);
  syncAllQuestionTitles();
}

function ensureAtLeastOneQuestionEditor() {
  if (!elements.questionList.querySelector(".question-editor")) {
    addQuestionEditor();
  }
}

function replaceQuestionEditors(questions) {
  elements.questionList.innerHTML = "";

  if (!questions.length) {
    addQuestionEditor();
    return;
  }

  questions.forEach((question) => addQuestionEditor(question));
}

function readQuestionsFromEditors() {
  return [...elements.questionList.querySelectorAll(".question-editor")]
    .map((editor) => ({
      prompt: editor.querySelector(".question-prompt").value.trim(),
      hint: editor.querySelector(".question-hint").value.trim(),
      answer: editor.querySelector(".question-answer").value.trim(),
    }))
    .filter((question) => question.prompt && question.answer);
}

function updateFileStatus() {
  if (state.draft.loadedQuizName) {
    elements.fileStatus.textContent = `Loaded quiz file: ${state.draft.loadedQuizName} (${state.questions.length} questions).`;
    return;
  }

  elements.fileStatus.textContent =
    "Use any quiz JSON file. Sample files already exist in the `question-packs` folder.";
}

function validateQuizPayload(payload) {
  if (!payload || !Array.isArray(payload.questions)) {
    throw new Error("Quiz file must contain a questions array.");
  }

  const normalizedQuestions = payload.questions
    .map((question) => ({
      prompt: String(question.prompt || "").trim(),
      hint: String(question.hint || "").trim(),
      answer: String(question.answer || "").trim(),
    }))
    .filter((question) => question.prompt && question.answer);

  if (!normalizedQuestions.length) {
    throw new Error("Quiz file does not contain any valid questions.");
  }

  return {
    title: String(payload.title || payload.id || "Quiz file").trim(),
    description: String(payload.description || "").trim(),
    questions: normalizedQuestions,
  };
}

async function loadQuizFromSelectedFile() {
  const [file] = elements.quizFileInput.files || [];

  if (!file) {
    elements.setupMessage.textContent = "Choose a quiz JSON file first.";
    return;
  }

  elements.setupMessage.textContent = "Loading quiz file...";

  try {
    const text = await file.text();
    const payload = JSON.parse(text);
    const quiz = validateQuizPayload(payload);

    state.draft.loadedQuizName = `${quiz.title}${quiz.description ? ` - ${quiz.description}` : ""}`;
    state.questions = quiz.questions;
    replaceQuestionEditors(quiz.questions);
    updateFileStatus();
    elements.setupMessage.textContent = `${quiz.title} loaded with ${quiz.questions.length} questions.`;
    saveState();
  } catch (error) {
    elements.setupMessage.textContent = "Could not read that file. Make sure it is valid quiz JSON.";
    console.error(error);
  }
}

function clearQuestions() {
  state.draft.loadedQuizName = "";
  state.questions = [];
  elements.quizFileInput.value = "";
  replaceQuestionEditors([]);
  updateFileStatus();
  elements.setupMessage.textContent = "Question bank cleared. Load another file or add questions manually.";
  saveState();
}

function renderTeamPreview() {
  if (!state.teams.length) {
    elements.teamPreview.className = "team-preview empty-state";
    elements.teamPreview.textContent = "Generate teams to start.";
    return;
  }

  elements.teamPreview.className = "team-preview";
  elements.teamPreview.innerHTML = "";

  state.teams.forEach((team, index) => {
    const card = document.createElement("article");
    card.className = "team-chip";
    card.innerHTML = `
      <label class="field-label" for="team-name-${team.id}">Team name</label>
      <input id="team-name-${team.id}" type="text" value="${escapeHtml(team.name)}" />
      <p class="team-members">${escapeHtml(team.players.join(", "))}</p>
      <small>${team.players.length} player${team.players.length === 1 ? "" : "s"}</small>
    `;

    card.querySelector("input").addEventListener("input", (event) => {
      state.teams[index].name = event.target.value.trim() || seededTeamName(index);
      persistSetupDraft();
      renderLeaderboard();
      renderTurnOrder();
    });

    elements.teamPreview.appendChild(card);
  });
}

function persistSetupDraft() {
  if (state.stage !== "setup") {
    return;
  }

  state.draft.playerNames = elements.playerNames.value;
  state.draft.teamSize = Number(elements.teamSize.value) || 2;
  state.questions = readQuestionsFromEditors();
  saveState();
}

function logEvent(message) {
  state.logs.unshift({
    id: crypto.randomUUID(),
    message,
    timestamp: new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
  });
  state.logs = state.logs.slice(0, 12);
  renderLogs();
  saveState();
}

function initializeGame() {
  const firstTeamIndex = Math.floor(Math.random() * state.teams.length);

  state.game = {
    questionIndex: 0,
    round: 1,
    currentTeamIndex: firstTeamIndex,
    questionStartTeamIndex: firstTeamIndex,
    nextQuestionStartTeamIndex: firstTeamIndex,
    attemptsInRound: 0,
    pointsInPlay: 10,
    hintVisible: false,
    answerVisible: false,
    questionFinished: false,
    awaitingNextQuestion: false,
  };
}

function currentQuestion() {
  return state.questions[state.game.questionIndex];
}

function hasMoreQuestions() {
  return state.game.questionIndex < state.questions.length;
}

function isQuizComplete() {
  return Boolean(state.logs[0] && state.logs[0].message === "Quiz finished.");
}

function scrollGameIntoView(smooth = false) {
  const topTarget = Math.max((elements.gamePanel?.offsetTop || 0) - 12, 0);

  window.scrollTo({
    top: topTarget,
    behavior: smooth ? "smooth" : "auto",
  });
}

function getWinningTeams() {
  if (!state.teams.length) {
    return [];
  }

  const topScore = Math.max(...state.teams.map((team) => team.score));
  return state.teams.filter((team) => team.score === topScore);
}

function startGame() {
  state.questions = readQuestionsFromEditors();
  const players = parsePlayers();
  const teamSize = Number(elements.teamSize.value);
  const teamSetupError = validateTeamSetup(players, teamSize);

  if (teamSetupError) {
    elements.setupMessage.textContent = teamSetupError;
    return;
  }

  if (!state.teams.length) {
    elements.setupMessage.textContent = "Create teams before starting the quiz.";
    return;
  }

  if (!state.questions.length) {
    elements.setupMessage.textContent = "Load a quiz file or add at least one valid question.";
    return;
  }

  state.teams = state.teams.map((team, index) => ({
    ...team,
    name: team.name.trim() || seededTeamName(index),
    score: 0,
  }));
  state.logs = [];
  state.stage = "game";
  initializeGame();
  logEvent(`Quiz started. ${state.teams[state.game.currentTeamIndex].name} begins.`);
  render();
  requestAnimationFrame(() => scrollGameIntoView());
}

function nextTeamIndex(index) {
  return (index + 1) % state.teams.length;
}

function advanceTurn(reason) {
  const activeTeam = state.teams[state.game.currentTeamIndex];
  state.game.attemptsInRound += 1;

  if (reason === "pass") {
    logEvent(`${activeTeam.name} passed. Next team plays for ${state.game.pointsInPlay + 1} points.`);
  } else if (reason === "incorrect") {
    logEvent(`${activeTeam.name} answered incorrectly.`);
  }

  if (state.game.attemptsInRound >= state.teams.length) {
    if (state.game.round === 1) {
      state.game.round = 2;
      state.game.attemptsInRound = 0;
      state.game.pointsInPlay = 5;
      state.game.hintVisible = true;
      state.game.currentTeamIndex = state.game.questionStartTeamIndex;
      logEvent("No correct answer in round 1. Hint revealed and round 2 starts at 5 points.");
      render();
      saveState();
      return;
    }

    state.game.answerVisible = true;
    state.game.questionFinished = true;
    logEvent(`No team solved it. Answer: ${currentQuestion().answer}.`);
    finishQuestion(state.game.currentTeamIndex);
    return;
  }

  state.game.currentTeamIndex = nextTeamIndex(state.game.currentTeamIndex);
  state.game.pointsInPlay += 1;
  render();
  saveState();
}

function markCorrect() {
  const activeTeam = state.teams[state.game.currentTeamIndex];
  activeTeam.score += state.game.pointsInPlay;
  state.game.answerVisible = true;
  state.game.questionFinished = true;
  logEvent(`${activeTeam.name} answered correctly and earned ${state.game.pointsInPlay} points.`);
  finishQuestion(state.game.currentTeamIndex);
}

function finishQuestion(endingTeamIndex) {
  state.game.nextQuestionStartTeamIndex = nextTeamIndex(endingTeamIndex);

  if (state.game.questionIndex >= state.questions.length - 1) {
    logEvent("Quiz finished.");
    render();
    saveState();
    return;
  }

  state.game.awaitingNextQuestion = true;
  render();
  saveState();
}

function advanceToNextQuestion() {
  if (!state.game || !state.game.awaitingNextQuestion) {
    return;
  }

  const startingTeam = state.teams[state.game.nextQuestionStartTeamIndex];
  const nextQuestionNumber = state.game.questionIndex + 2;
  state.game.questionIndex += 1;
  state.game.round = 1;
  state.game.currentTeamIndex = state.game.nextQuestionStartTeamIndex;
  state.game.questionStartTeamIndex = state.game.nextQuestionStartTeamIndex;
  state.game.attemptsInRound = 0;
  state.game.pointsInPlay = 10;
  state.game.hintVisible = false;
  state.game.answerVisible = false;
  state.game.questionFinished = false;
  state.game.awaitingNextQuestion = false;
  logEvent(`${startingTeam.name} will start question ${nextQuestionNumber}.`);
  render();
  saveState();
  requestAnimationFrame(() => scrollGameIntoView());
}

function revealHintNow() {
  if (state.game.hintVisible) {
    return;
  }

  state.game.round = 2;
  state.game.hintVisible = true;
  state.game.pointsInPlay = 5;
  state.game.attemptsInRound = 0;
  state.game.currentTeamIndex = state.game.questionStartTeamIndex;
  logEvent("Quizmaster revealed the hint early. Round 2 begins at 5 points.");
  render();
  saveState();
}

function resetGame() {
  localStorage.removeItem(STORAGE_KEY);
  state.stage = "setup";
  state.draft = {
    playerNames: "",
    teamSize: 2,
    loadedQuizName: "",
  };
  state.teams = [];
  state.questions = [];
  state.logs = [];
  state.game = null;
  elements.playerNames.value = "";
  elements.teamSize.value = 2;
  elements.quizFileInput.value = "";
  elements.setupMessage.textContent = "";
  replaceQuestionEditors([]);
  updateFileStatus();
  render();
}

function renderLeaderboard() {
  elements.leaderboard.innerHTML = "";
  const rankedTeams = [...state.teams].sort((left, right) => right.score - left.score);
  const activeTeamId = state.stage === "game" && state.game ? state.teams[state.game.currentTeamIndex]?.id : null;
  const topScore = rankedTeams.length ? rankedTeams[0].score : null;

  if (!rankedTeams.length) {
    elements.leaderboard.innerHTML = '<p class="status-text">Teams will appear here.</p>';
    return;
  }

  rankedTeams.forEach((team, index) => {
    const row = document.createElement("article");
    const isTopper = topScore !== null && team.score === topScore && topScore > 0;
    const isCurrent = activeTeamId === team.id;
    row.className = `leaderboard-row${isTopper ? " topper" : ""}${isCurrent ? " current-team" : ""}`;
    row.innerHTML = `
      <div>
        <span>${isTopper ? "Leader" : `#${index + 1}`}</span>
        <strong>${escapeHtml(team.name)}</strong>
        <span>${escapeHtml(team.players.join(", "))}</span>
      </div>
      <div class="leaderboard-score">${team.score}</div>
    `;
    elements.leaderboard.appendChild(row);
  });
}

function renderTurnOrder() {
  elements.turnOrder.innerHTML = "";

  if (!state.teams.length) {
    elements.turnOrder.innerHTML = '<p class="status-text">Turn order will appear here.</p>';
    return;
  }

  const leaderScore = Math.max(...state.teams.map((entry) => entry.score));

  state.teams.forEach((team, index) => {
    const chip = document.createElement("article");
    const isActive = state.stage === "game" && state.game && index === state.game.currentTeamIndex;
    const isLeader = team.score === leaderScore && team.score > 0;

    chip.className = `turn-chip${isActive ? " active" : ""}${isLeader ? " leader" : ""}`;
    chip.innerHTML = `
      <div class="turn-chip-main">
        <strong>${escapeHtml(team.name)}</strong>
        <small>${team.players.length} player${team.players.length === 1 ? "" : "s"}</small>
        ${isActive ? '<span class="turn-badge">Now Playing</span>' : ""}
      </div>
      <strong class="turn-score">${team.score} pts</strong>
    `;
    elements.turnOrder.appendChild(chip);
  });
}

function renderLogs() {
  elements.eventLog.innerHTML = "";

  if (!state.logs.length) {
    elements.eventLog.innerHTML = '<p class="status-text">The game log will appear here.</p>';
    return;
  }

  state.logs.forEach((entry) => {
    const item = document.createElement("article");
    item.className = "event-item";
    item.innerHTML = `
      <p>${escapeHtml(entry.message)}</p>
      <time>${entry.timestamp}</time>
    `;
    elements.eventLog.appendChild(item);
  });
}

function renderGameBoard() {
  if (!state.game || !hasMoreQuestions()) {
    return;
  }

  const team = state.teams[state.game.currentTeamIndex];
  const question = currentQuestion();
  const quizComplete = isQuizComplete();
  const waitingForNext = Boolean(state.game.awaitingNextQuestion);

  elements.questionNumberLabel.textContent = `Question ${state.game.questionIndex + 1} of ${state.questions.length}`;
  elements.currentTeamName.textContent = team.name;
  elements.roundLabel.textContent = String(state.game.round);
  elements.pointsInPlay.textContent = String(state.game.pointsInPlay);
  elements.questionPrompt.textContent = question.prompt;
  elements.questionHint.textContent = question.hint || "No hint added.";
  elements.questionAnswer.textContent = question.answer;
  elements.hintBox.classList.toggle("hidden", !state.game.hintVisible);
  elements.answerBox.classList.toggle("hidden", !state.game.answerVisible);
  elements.turnMessage.textContent = quizComplete
    ? "Quiz complete. Celebration mode is on and the final leaderboard is locked."
    : waitingForNext
      ? "Answer shown. Move on when everyone has seen it."
    : `${team.name} is up. Use the controls below to record the result.`;

  [elements.correctBtn, elements.incorrectBtn, elements.passBtn, elements.revealHintBtn].forEach(
    (button) => {
      button.disabled = quizComplete || waitingForNext;
    }
  );
  elements.nextQuestionBtn.classList.toggle("hidden", !waitingForNext);
  elements.nextQuestionBtn.disabled = quizComplete || !waitingForNext;
}

function isTypingTarget(target) {
  return Boolean(
    target &&
      (target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable)
  );
}

function handleKeyboardShortcuts(event) {
  if (state.stage !== "game" || !state.game || isTypingTarget(event.target)) {
    return;
  }

  const quizComplete = isQuizComplete();
  const waitingForNext = Boolean(state.game.awaitingNextQuestion);
  const key = event.key.toLowerCase();

  if (waitingForNext && key === "n") {
    event.preventDefault();
    advanceToNextQuestion();
    return;
  }

  if (quizComplete || waitingForNext) {
    return;
  }

  if (key === "c") {
    event.preventDefault();
    markCorrect();
  } else if (key === "w") {
    event.preventDefault();
    advanceTurn("incorrect");
  } else if (key === "p") {
    event.preventDefault();
    advanceTurn("pass");
  } else if (key === "h") {
    event.preventDefault();
    revealHintNow();
  }
}

function renderWinnerBanner() {
  if (state.stage !== "game" || !isQuizComplete()) {
    elements.winnerBanner.classList.add("hidden");
    return;
  }

  const winners = getWinningTeams();
  const winningNames = winners.map((team) => team.name);
  const winningScore = winners[0]?.score ?? 0;

  elements.winnerBanner.classList.remove("hidden");

  if (winners.length === 1) {
    elements.winnerTitle.textContent = `${winningNames[0]} wins the quiz!`;
    elements.winnerSubtitle.textContent = `Celebration time: ${winningNames[0]} finishes on ${winningScore} points.`;
    return;
  }

  elements.winnerTitle.textContent = `${winningNames.join(" and ")} share the win!`;
  elements.winnerSubtitle.textContent = `What a finish. The winning teams all end on ${winningScore} points.`;
}

function renderSetup() {
  renderTeamPreview();
  renderLeaderboard();
  renderTurnOrder();
  renderLogs();
  updateFileStatus();
}

function render() {
  const inGame = state.stage === "game";

  document.body.classList.toggle("game-mode", inGame);
  elements.setupPanel.classList.toggle("hidden", inGame);
  elements.gamePanel.classList.toggle("hidden", !inGame);
  elements.gamePhasePill.textContent = inGame ? "Live game" : "Setup";

  if (inGame) {
    renderWinnerBanner();
    renderLeaderboard();
    renderTurnOrder();
    renderLogs();
    renderGameBoard();
  } else {
    elements.winnerBanner.classList.add("hidden");
    renderSetup();
  }

  saveState();
}

elements.generateTeamsBtn.addEventListener("click", () => {
  const players = parsePlayers();
  const teamSize = Number(elements.teamSize.value);
  const validationMessage = validateTeamSetup(players, teamSize);

  if (validationMessage) {
    elements.setupMessage.textContent = validationMessage;
    return;
  }

  state.teams = createTeamsFromPlayers(players, teamSize);
  state.draft.playerNames = elements.playerNames.value;
  state.draft.teamSize = teamSize;
  elements.setupMessage.textContent = `${state.teams.length} team${state.teams.length === 1 ? "" : "s"} created.`;
  renderTeamPreview();
  renderLeaderboard();
  renderTurnOrder();
  saveState();
});

elements.addQuestionBtn.addEventListener("click", () => {
  state.draft.loadedQuizName = "";
  addQuestionEditor();
  updateFileStatus();
  persistSetupDraft();
});
elements.loadFileBtn.addEventListener("click", loadQuizFromSelectedFile);
elements.clearQuestionsBtn.addEventListener("click", clearQuestions);
elements.startGameBtn.addEventListener("click", startGame);
elements.resetGameBtn.addEventListener("click", resetGame);
elements.correctBtn.addEventListener("click", markCorrect);
elements.incorrectBtn.addEventListener("click", () => advanceTurn("incorrect"));
elements.passBtn.addEventListener("click", () => advanceTurn("pass"));
elements.revealHintBtn.addEventListener("click", revealHintNow);
elements.nextQuestionBtn.addEventListener("click", advanceToNextQuestion);
elements.playerNames.addEventListener("input", persistSetupDraft);
elements.teamSize.addEventListener("input", persistSetupDraft);
elements.quizFileInput.addEventListener("change", () => {
  const [file] = elements.quizFileInput.files || [];
  elements.fileStatus.textContent = file
    ? `Selected file: ${file.name}`
    : "Use any quiz JSON file. Sample files already exist in the `question-packs` folder.";
});
document.addEventListener("keydown", handleKeyboardShortcuts);

function hydrateSetupFromState() {
  if (state.stage === "game") {
    return;
  }

  elements.playerNames.value = state.draft.playerNames || "";
  elements.teamSize.value = String(state.draft.teamSize || 2);
  replaceQuestionEditors(state.questions);
  updateFileStatus();
}

function bootstrap() {
  loadState();
  hydrateSetupFromState();
  render();
}

bootstrap();
