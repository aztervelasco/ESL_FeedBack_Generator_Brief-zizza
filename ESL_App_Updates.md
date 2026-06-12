# ESL Feedback Generator — App Update Instructions

This document contains all the changes to be implemented on the existing ESL Class Observation & Feedback Generator app.

---

## 1. UPDATE CHECKLIST SECTIONS

Replace all existing checklist sections with the following 8 new sections:

---

### Section 1 — Engagement & Focus
> Single choice (radio button / one selection only)

- High: Enthusiastic & focused throughout
- Mid-High: Participated well, but occasionally distracted
- Mid-Low: Participated only when prompted/called on
- Low: Quiet, hesitant, or needed constant encouragement

---

### Section 2 — Parent Involvement
> Single choice (radio button / one selection only)

- No parent present
- Parent nearby but let the student work independently
- Parent helped appropriately (clarified instructions / gave encouragement)
- Parent was too involved (answered for the student)

---

### Section 3 — Answering & Sentences
> Multiple choice (checkboxes)

- Answered independently & correctly
- Answered confidently but needed choices/options
- Needed examples/models before responding
- Used complete, detailed sentences
- Gave short phrases / One-word answers
- Improved sentence structure after correction

---

### Section 4 — Speaking & Pronunciation
> Multiple choice (checkboxes)

- Spoke confidently and clearly
- Became more confident as class progressed
- Hesitant to speak / Needed encouragement
- Minor pronunciation errors / Missed ending sounds
- Improved pronunciation after correction

---

### Section 5 — Reading Skills
> Single choice (radio button / one selection only)

- Read fluently and accurately
- Can read well, but struggles to speak/explain
- Minor reading errors / Needed occasional support
- Struggled with reading / Needed heavy guidance

---

### Section 6 — Lesson Content (Vocab & Grammar)
> Multiple choice (checkboxes)

- Grasped concepts & new vocabulary quickly
- Good understanding, but minor grammar errors
- Frequent grammar errors / Needs continued practice
- Needed vocabulary support / Reminders to use target words
- Needed frequent repetition & step-by-step guidance

---

### Section 7 — Mindset & Feedback
> Multiple choice (checkboxes)

- Strong logical/creative thinking (solved problems alone)
- Accepted corrections positively & self-corrected
- Showed improvement compared to previous classes
- Persistent despite challenges / Completed all activities

---

### Section 8 — Parent Homework Suggestions
> Pick 1–2 only (checkboxes, max 2 selections)

- Encourage answering in complete sentences
- Practice reading aloud for a few minutes daily
- Review today's new vocabulary and target words
- Encourage clear pronunciation practice
- Continue providing praise to build confidence

---

## 2. ADD GENDER FIELD

- Add a **Gender** dropdown in the header fields section alongside Student Name, Date, Teacher Name, and Lesson/Unit
- Options: **Male / Female**
- The AI feedback generator must automatically use the correct pronoun:
  - Male → **he / his / him**
  - Female → **she / her**
- Store gender value in the database (`feedback_records` table — add a `gender` column of type `text`)

---

## 3. UPDATE BACKEND — AI PROMPT

Update the Gemini API prompt in `/server/routes/feedback.js` to reflect the following:

- Use the **new 8 checklist sections** as observation input
- Automatically use the **correct pronoun** based on the selected gender
- Keep the same output format: warm, encouraging, parent-friendly paragraph (3–4 sentences)
- Strengths first, then gently note areas for continued practice
- Weave in any **Custom Notes** typed by the teacher for personalization

**Updated sample prompt structure:**
```
You are an ESL teacher writing a short progress note to a parent about [Student Name] ([Gender]) from [Date]'s class on [Lesson/Unit].

Based on these observations:
[List of checked items grouped by section]

Additional notes from the teacher: [Custom Notes if any]

Write a warm, encouraging 3–4 sentence paragraph. Use the pronoun [he/she] consistently. Mention strengths first, then gently note areas for continued practice. Keep it simple and parent-friendly.
```

---

## 4. DARK MODE / LIGHT MODE

- Add a **toggle button** (sun 🌞 / moon 🌙 icon) in the top navigation bar
- **Light Mode** (default): white/light background, dark text
- **Dark Mode**: dark background (`#1E1E2E`), light text, adjusted card/border colors
- Save the user's preference in **localStorage** so it persists on next visit
- Apply mode using a CSS class on the root `<html>` or `<body>` element (e.g. `class="dark"`)

---

## 5. HISTORY PAGE — FILTERS

Add filter controls at the top of the Observation History page:

### Filter by Gender
- Buttons or dropdown: **All / Male / Female**

### Filter by Lesson Unit
- Dropdown that **auto-populates** with all unique lesson/unit values pulled from saved records
- Example: "Unit 5 — Past Tense", "Unit 3 — Greetings", etc.

### Filter Behavior
- Both filters must work **together simultaneously**
  - Example: Filter by Female + Unit 5 → shows only female students in Unit 5
- Add a **"Clear Filters"** button to reset back to showing all records

---

## 6. SAVE TIMESTAMP — SHOW DATE & TIME

- Currently the app only displays the **date** a record was saved
- Update all instances to show the **full date and time**
- Display format: `June 11, 2026 · 3:45 PM`
- Apply this to:
  - History list / record cards
  - Full record detail view
  - The `created_at` column in Supabase is already a full timestamp — just parse and display the time portion as well

---

## 7. DATABASE UPDATES

Apply the following changes to the `feedback_records` table in Supabase:

```sql
-- Add gender column
ALTER TABLE feedback_records
ADD COLUMN gender TEXT;
```

> Note: `created_at` already stores full timestamp — no schema change needed, just update the frontend display.

---

## Summary of All Changes

| # | Change | Area |
|---|--------|------|
| 1 | Replace checklist with 8 new sections | Frontend |
| 2 | Add Gender field + pronoun logic | Frontend + Backend |
| 3 | Update AI prompt for new sections + gender | Backend |
| 4 | Dark mode / Light mode toggle | Frontend |
| 5 | History filters by gender + lesson unit | Frontend |
| 6 | Show full date & time on saved records | Frontend |
| 7 | Add gender column to Supabase table | Database |
