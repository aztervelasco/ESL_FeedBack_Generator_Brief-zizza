# ESL Class Observation & Feedback Generator — Project Brief

## Overview
Build a web app for an ESL teacher to fill out a class observation checklist by checking boxes, then auto-generate a written feedback paragraph for the student/parent using AI. Records of past feedback should be saved.

## Tech Stack
- **Frontend:** React (Vite + React Router v6)
- **Backend:** Express.js (Node.js), deployed on Railway or Render
- **AI:** Gemini API (`gemini-2.5-flash` model) via `@google/genai` package
- **Database:** Supabase (Postgres) — connected via Supabase JS client
- **Styling:** Tailwind CSS (via CDN or PostCSS setup with Vite)

## Environment Variables
- `GEMINI_API_KEY` — from Google AI Studio
- `VITE_API_BASE_URL` — base URL of your Express backend (e.g. `https://your-api.onrender.com`)
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` — from Supabase project settings (backend only)

---

## Project Structure

```
/
├── client/                  # React frontend (Vite)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── FormPage.jsx         # Main checklist + feedback form
│   │   │   └── HistoryPage.jsx      # Saved records list
│   │   ├── components/
│   │   │   ├── ChecklistSection.jsx # Collapsible checklist group
│   │   │   └── FeedbackBox.jsx      # Editable AI output area
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── index.html
│
└── server/                  # Express backend
    ├── routes/
    │   ├── feedback.js       # POST /api/feedback
    │   └── records.js        # GET + POST /api/records
    ├── lib/
    │   └── supabase.js       # Supabase client setup
    └── index.js              # Express app entry
```

---

## 1. Form Page (`/`)

### Header Fields
- Student Name (text input)
- Date (date picker, default to today)
- Teacher Name (text input)
- Lesson/Unit (text input)

### Checklist Sections (checkboxes — multiple selectable per section)

**1. Attendance & Readiness**
- Arrived on time
- Arrived a few minutes late
- Joined very late / Absent
- Camera & Mic working well
- Tech / Internet difficulties
- Had required materials ready
- Unprepared with materials

**2. Attitude & Behavior**
- Very enthusiastic & active
- Participated when called on
- Inconsistent / Rarely participated
- Polite, respectful, cooperative
- Cheerful and energetic
- Serious and focused
- Shy / Hesitant to respond
- Easily frustrated / Upset
- Maintained focus throughout
- Distracted (looked away/toys)
- Needed redirection / Left seat

**3. Listening Skills**
- Understood instructions immediately
- Needed repetition (once/multiple)
- Followed directions accurately
- Followed multi-step directions
- Missed details / Needs visual cues
- Needed teacher modeling
- Difficulty understanding spoken English

**4. Speaking Skills**
- Spoke confidently & willingly
- Needed encouragement / Shy
- Avoided speaking entirely
- Answered independently
- Used complete sentences
- Expanded answers with details
- Short phrases / One-word answers
- Frequent "I don't know" responses
- Spoke fluently with minor pauses
- Struggled to express ideas
- Fluency improved during lesson

**5. Pronunciation**
- Clear, easy-to-understand speech
- Minor pronunciation errors
- Difficulty with new vocabulary
- Difficulty with specific / ending sounds
- Difficulty with word / sentence stress
- Monotone delivery
- Self-corrected errors reliably
- Improved quickly after correction
- Needs continuous practice

**6. Vocabulary**
- Understood & used target words correctly
- Remembered past vocabulary
- Used vocabulary independently
- Needed support / frequent reminders
- Asked about unfamiliar words
- Used context clues effectively
- Misused words / Needs review

**7. Grammar**
- Used target grammar accurately
- Demonstrated rule understanding
- Minor mistakes / Frequent errors
- Needed sentence models
- Self-corrected / Improved via feedback
- Omitted important structures

**8. Reading Skills**
- Read fluently and accurately
- Minor / Frequent reading errors
- Mispronounced words / Skipped words
- Understood text / Answered CQ correctly
- Identified key details / Predicted well
- Inferred meaning from context
- Needed guidance / Recalled poorly

**9. Writing Skills (If Applicable)**
- Wrote independently and followed rules
- Correct capitalization & punctuation
- Neat handwriting / Spelled accurately
- Minor / Frequent spelling errors
- Organized ideas clearly / Needs prompts

**10. Critical Thinking**
- Thought carefully / Explained reasoning
- Used logic / Made connections
- Asked thoughtful questions / Creative
- Needed hints / Gave up easily
- "I don't know" without trying

**11. Response to Correction**
- Accepted corrections positively
- Applied corrections immediately
- Self-corrected / Modeled successfully
- Discouraged / Ignored corrections

**12. Parent/Support**
- Parent observed appropriately
- Parent provided excessive help
- Relied heavily on parent support
- Worked independently with parent present

**13. Progress Comparison**
- Significant / Steady progress seen
- Maintained previous performance
- Improved confidence & participation
- Improved sound, vocabulary, or grammar
- Needs reinforcement / Regression seen

### Action Button
- "Generate Feedback" button — sends header info + all checked items to `POST /api/feedback`
- Show loading state while waiting for AI response
- Display generated feedback in an editable `<textarea>` (teacher can tweak before saving/copying)
- "Save Record" button — saves to Supabase via `POST /api/records`
- "Copy to Clipboard" button

---

## 2. API Route — `POST /api/feedback`

**Request body:**
```json
{
  "studentName": "string",
  "date": "string",
  "teacherName": "string",
  "lessonUnit": "string",
  "checkedItems": { "SectionName": ["item1", "item2"], ... }
}
```

**Logic:**
1. Build a prompt for Gemini combining the checked items, grouped by category
2. Call Gemini API (`gemini-2.5-flash`) to generate a warm, encouraging, parent-friendly feedback paragraph (2-4 sentences) highlighting strengths first, then areas for growth
3. Return `{ "feedback": "generated text" }`

**Sample prompt structure to send to Gemini:**
> "You are an ESL teacher writing a short progress note to a parent about [Student Name]'s class on [Date]. Based on these observations: [list of checked items grouped by category], write a warm, encouraging 3-4 sentence paragraph. Mention strengths first, then gently note areas for continued practice. Keep it simple and parent-friendly."

---

## 3. API Routes — `/api/records`

**`POST /api/records`** — Save a record to Supabase  
**`GET /api/records`** — Fetch all saved records (optionally filter by `?student=name`)

**Supabase table: `feedback_records`**
| Column | Type |
|---|---|
| id | uuid (auto) |
| student_name | text |
| date | date |
| teacher_name | text |
| lesson_unit | text |
| checked_items | jsonb |
| feedback_text | text |
| created_at | timestamp (auto) |

---

## 4. History Page (`/history`)
- List of saved records (student name, date, short preview of feedback)
- Click to expand and view full record + full feedback text
- Search/filter by student name (nice-to-have)
- Uses React Router `<Link>` for navigation between `/` and `/history`

---

## React-Specific Notes

- Use **React Router v6** (`createBrowserRouter` or `<BrowserRouter>`) for client-side routing between `/` and `/history`
- Use **`useState`** for checklist state, header fields, and generated feedback
- Use **`useEffect`** to fetch records on the History page
- Group checklist state as: `{ [sectionName]: { [itemLabel]: boolean } }`
- Checklist sections should use a **collapsible/accordion** component (can use a simple `useState` toggle per section)
- API calls to the Express backend use `fetch` or `axios` with `VITE_API_BASE_URL` as base

---

## Design Notes
- Mobile-friendly (teacher may use phone/tablet during/after class)
- Group checkboxes by section with collapsible/accordion sections for easier scrolling
- Keep UI clean and simple — Tailwind, minimal colors, readable fonts
