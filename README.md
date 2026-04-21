# Friends Quiz Night

Friends Quiz Night is a single-screen quizmaster website for playing team quizzes with friends.

One person, the quizmaster, runs the website for the whole room. The teams do not log in separately. The quizmaster shows the shared screen to everyone, controls question flow, records right and wrong answers, reveals hints, reveals answers, and moves the game to the next question.

This README is written for both:
- humans who want to run or modify the game
- AI tools such as GPT that may later help create quiz files, extend features, or update the codebase

## Product summary

This website is designed for a live social quiz where:
- players are split into teams
- each team gets a turn to answer
- questions can be passed to the next team
- the points value changes as the question moves around
- a second round with a hint is possible
- the answer is shown before the quizmaster moves on
- the leaderboard updates live

The app is fully client-side and runs in the browser.

## Core concept

The game is not a buzzer quiz and not a multi-user login system.

It is a quizmaster-led rotation game:
- the quizmaster loads a quiz file
- enters player names
- chooses how many players should be in each team
- the app shuffles teams
- the quizmaster runs each question live using the on-screen controls

## Game rules

These are the intended rules implemented by the website.

### Team setup

- The quizmaster enters player names.
- The quizmaster chooses how many players should be in each team.
- The app randomly shuffles players into teams.
- The quizmaster can rename the teams before the game starts.

### Starting the quiz

- The app chooses a random starting team for the first question.
- A question appears on screen.
- The current team attempts the question first.

### Scoring: round 1

- Round 1 starts at `10` points.
- If the current team answers correctly, they get the current points value.
- If they answer incorrectly, they get `0` and the question moves to the next team.
- If they pass, they also get `0` and the question moves to the next team.
- Each time the question moves to the next team, the points in play increase by `1`.

Example:
- Team A starts on 10
- if they pass or get it wrong, Team B gets a chance for 11
- then Team C for 12
- and so on

### Hint round: round 2

- If all teams fail to answer correctly in round 1, the app reveals a hint.
- Round 2 then begins.
- Round 2 starts at `5` points.
- The question returns to the starting team for that question.
- The same rotation logic happens again.
- Each move to the next team increases the points in play by `1` during round 2 as well.

### If nobody gets the question

- If all teams fail again in round 2, nobody gets points.
- The correct answer is revealed on screen.
- The app does not move immediately to the next question.
- The quizmaster must click `Next question` so everyone can first see the answer.

### If somebody gets the question right

- The correct answer is shown on screen.
- The app pauses on that question so the room can see the answer.
- The quizmaster clicks `Next question` to continue.

### Who starts the next question

- The next question starts with the team after the team where the previous question ended.

In practice:
- if a team answers correctly, the next team after them starts the following question
- if no team gets it and the last attempt was by Team D, then Team A starts the next question

### End of quiz

- When the last question is completed, the app shows a winner celebration banner.
- If there is a tie, the app announces a shared win.
- The leaderboard remains visible as the final result.

## Current website features

- Random team generation from a player list
- Team renaming before the game starts
- Load quiz files directly from the browser file picker
- Edit the loaded question bank manually before starting
- Live quizmaster controls:
  - mark correct
  - mark wrong
  - mark pass
  - reveal hint
  - move to next question after answer reveal
- Live leaderboard
- Turn tracker showing the current team
- Winner celebration banner at the end
- Keyboard shortcuts for the quizmaster
- Automatic local progress saving in the browser

## Keyboard shortcuts

These work during the live game when the quizmaster is not typing in an input field.

- `C`: mark correct
- `W`: mark wrong
- `P`: pass
- `H`: reveal hint
- `N`: next question after the answer is shown

## Save and resume behavior

The app saves progress in browser `localStorage`.

That means:
- if the quiz is not finished, it can usually be resumed later
- this works on the same browser on the same device
- it does not automatically sync across devices
- if browser storage is cleared, the saved game is lost
- if `Reset game` is used, the saved game is cleared

Important limitation:
- this is not yet a cloud-synced multiplayer system
- hosting the website online does not automatically make saved progress shared across devices

## How to run

Open [index.html](/Users/maykum02/Documents/Personal/Codes/Quiz/index.html) in any modern browser.

## How to use

1. Open the website.
2. Enter player names, one per line.
3. Choose players per team.
4. Click `Shuffle teams`.
5. Optionally rename teams.
6. Load a quiz `.json` file.
7. Optionally edit the loaded questions.
8. Click `Start quiz`.
9. Run the game using the live controls.

## Quiz file format

Each quiz lives in a JSON file.

The website expects this structure:

```json
{
  "id": "capitals-of-countries",
  "title": "Capitals of Countries",
  "description": "A geography round focused on capitals.",
  "questions": [
    {
      "prompt": "What is the capital of France?",
      "hint": "The Eiffel Tower is there.",
      "answer": "Paris"
    }
  ]
}
```

### Required rules for quiz files

- Root object must contain:
  - `id`
  - `title`
  - `description`
  - `questions`
- `questions` must be an array
- each question object should contain:
  - `prompt`
  - `hint`
  - `answer`
- every question must have a non-empty `prompt`
- every question must have a non-empty `answer`
- hints may be short, direct, and useful

## Sample quiz packs

Sample quiz files are in [question-packs](/Users/maykum02/Documents/Personal/Codes/Quiz/question-packs).

Included examples:
- `question-packs/capitals-of-countries.json`
- `question-packs/cricket-in-india.json`
- `question-packs/famous-places-of-india.json`
- `question-packs/general-knowledge-night.json`
- `question-packs/india-history-and-freedom-movement.json`
- `question-packs/india-states-and-capitals.json`
- `question-packs/indian-cinema-and-bollywood.json`
- `question-packs/indian-food-festivals-and-culture.json`
- `question-packs/template.quiz.json`

## GPT / AI authoring guidance

If GPT or another AI is asked to create a new quiz file for this website, it should follow these rules:

- return valid JSON only when generating a quiz file
- use the exact root keys:
  - `id`
  - `title`
  - `description`
  - `questions`
- make `id` lowercase and hyphen-separated
- keep all questions fact-based and unambiguous
- avoid duplicate questions
- keep hints short and helpful
- keep answers concise
- if a specific count is requested, return exactly that many questions
- prefer stable facts unless the user explicitly asks for current affairs
- for India-focused quizzes, prefer Indian English spelling and familiar context

Reusable prompt template for GPT:
- [question-packs/TEMPLATE_PROMPT.md](/Users/maykum02/Documents/Personal/Codes/Quiz/question-packs/TEMPLATE_PROMPT.md)

Reusable JSON skeleton:
- [question-packs/template.quiz.json](/Users/maykum02/Documents/Personal/Codes/Quiz/question-packs/template.quiz.json)

## AI context for future changes

If an AI assistant is updating this project later, these points matter:

- This is a browser-only app.
- It does not require a backend to function.
- It is designed for one quizmaster and a shared display.
- Teams do not have individual accounts.
- Quiz packs are loaded from JSON files chosen by the quizmaster.
- Progress is currently stored in browser `localStorage`.
- The game intentionally pauses after showing the correct answer.
- The quizmaster must explicitly move to the next question.
- India-focused quiz content is a major use case.

## Main project files

- [index.html](/Users/maykum02/Documents/Personal/Codes/Quiz/index.html): main app markup
- [styles.css](/Users/maykum02/Documents/Personal/Codes/Quiz/styles.css): visual design and layout
- [app.js](/Users/maykum02/Documents/Personal/Codes/Quiz/app.js): quiz logic, UI state, persistence, shortcuts
- [question-packs](/Users/maykum02/Documents/Personal/Codes/Quiz/question-packs): sample and template quiz JSON files

## Good next improvements

Potential future upgrades:
- export and import saved game state to a file
- optional cloud save for cross-device resume
- projector mode with larger text
- per-question countdown timer
- optional tie-breaker round generation
