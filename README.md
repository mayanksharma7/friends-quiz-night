# Friends Quiz Night

Live site: [mayanksharma7.github.io/friends-quiz-night](https://mayanksharma7.github.io/friends-quiz-night/)

Friends Quiz Night is a browser-based quizmaster app for running a team quiz on one shared screen. One person controls the game, everyone else watches and answers in the room.

## What it does

- creates random teams from a list of player names
- lets you rename teams before starting
- loads quiz questions from a JSON file
- runs the game round by round on one screen
- keeps score and shows a live leaderboard
- reveals hints and answers at the right time
- plays event sounds for correct, wrong, pass, hint, next, and start
- saves progress in the same browser so you can continue later

## How the game works

1. Enter player names.
2. Choose how many players should be in each team.
3. Shuffle teams.
4. Load a quiz file.
5. Start the quiz.

For each question:

- the app picks a starting team
- round 1 starts at `10` points
- if a team gets it right, they get the current points
- if they get it wrong or pass, the next team gets a turn and the points go up by `1`
- if nobody gets it in round 1, the hint is shown
- round 2 starts at `5` points and follows the same rotation
- if nobody gets it in round 2, the answer is shown and no points are awarded
- the next question starts with the team after the one where the last question ended

When the quiz ends, the app shows the winning team on screen. If there is a tie, it shows a shared win.

## Running locally

Open [index.html](./index.html) in a browser.

## Quiz file format

Quiz files are plain JSON. Example:

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

Rules:

- `id`, `title`, `description`, and `questions` are required
- `questions` must be an array
- each question should have `prompt`, `hint`, and `answer`
- `prompt` and `answer` should not be empty

Sample files are in [question-packs](./question-packs).

## Sounds

Sounds are grouped by folder inside [sounds](./sounds):

- `start`
- `correct`
- `wrong`
- `pass`
- `hint`
- `next`

If you add, remove, or rename sound files, regenerate the sound manifest:

```bash
npm run sounds
```

If `npm` is not available, use:

```bash
node ./scripts/generate-sound-manifest.mjs
```

This updates [sounds/sound-manifest.js](./sounds/sound-manifest.js).

## Save and resume

Game progress is saved in browser `localStorage`.

That means:

- you can resume later in the same browser on the same device
- progress does not sync automatically across devices
- using `Reset game` clears the saved session

## Keyboard shortcuts

During the live game:

- `C` for correct
- `W` for wrong
- `P` for pass
- `H` for hint
- `N` for next question

## GitHub Pages

This repo includes a GitHub Pages workflow at [.github/workflows/deploy-pages.yml](./.github/workflows/deploy-pages.yml).

If Pages needs to be enabled again:

1. Open the repository on GitHub.
2. Go to `Settings` -> `Pages`.
3. Set the source to `GitHub Actions`.

After that, pushes to `main` should deploy the site automatically.
