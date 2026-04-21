# GPT Quiz Pack Template

Use this prompt with GPT when you want a brand-new quiz pack for this website.

## Prompt

Create a quiz pack for a website that loads quizzes from a JSON file.

Return only valid JSON.
Do not include markdown.
Do not include explanations.

Rules:
- Use this exact JSON shape:
  - `id`: short lowercase slug with hyphens only
  - `title`: human-readable quiz title
  - `description`: one short sentence
  - `questions`: array of question objects
- Each question object must contain exactly:
  - `prompt`
  - `hint`
  - `answer`
- Keep every question fact-based and unambiguous.
- Keep every hint short and useful without giving away the full answer immediately.
- Keep answers concise.
- Avoid duplicate questions.
- Make the quiz suitable for a live friends quiz night.
- If I ask for 50 questions, return exactly 50 questions.
- Prefer stable facts unless I explicitly ask for current affairs.
- Keep spelling consistent with Indian English when the topic is India-focused.

Topic: `<REPLACE WITH TOPIC>`
Audience: `<REPLACE WITH AUDIENCE OR DIFFICULTY>`
Question count: `<REPLACE WITH COUNT>`
Context preference: `<REPLACE WITH India-focused / global / school-level / mixed>`

## Expected JSON format

```json
{
  "id": "sample-topic-slug",
  "title": "Sample Topic Title",
  "description": "One-line description of the quiz topic.",
  "questions": [
    {
      "prompt": "Question text?",
      "hint": "Short helpful hint.",
      "answer": "Correct answer"
    }
  ]
}
```
