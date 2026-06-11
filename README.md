# 🍎 ESL Class Observation & Feedback Generator

Welcome, **Teacher Zizza**! This application is designed specifically to simplify your post-class feedback routine. Instead of manually drafting detailed, parent-friendly paragraphs after every ESL lesson, this system generates professional, warm, and highly personalized student summaries in seconds using advanced AI.

---

## 🌟 How This System Makes Your Work More Convenient

### 1. **Default Teacher Name Auto-Fill**
* **What it does**: The "Teacher Name" field automatically pre-fills with `"Teacher Zizza"` every time the form loads.
* **How it helps**: You never have to type your name again. If you ever need to enter a custom name, the system will instantly remember it for the next time!

### 2. **No Repetitive Typing for Repeat Students**
* **What it does**: Smart autocomplete suggestions dropdown shows up as you type in the "Student Name" field, presenting matching names from your class history.
* **How it helps**: Simply click the student's name from the dropdown to select it. This prevents typos and saves keyboard clicks.

### 3. **Memory for Back-to-Back Lessons**
* **What it does**: The system automatically remembers the last "Lesson / Unit" you entered.
* **How it helps**: If you are teaching the same curriculum level or unit to multiple students back-to-back, you don't have to write it again. The value is waiting for you on the next student's form.

### 4. **AI Custom Notes for True Personalization**
* **What it does**: Under class details, there is a **"Custom Notes"** text box where you can type raw highlights (e.g. *"Student lost a tooth today"* or *"Struggled with the word 'elephant'"*).
* **How it helps**: Instead of generic reviews, the AI weaves these exact highlights into a beautiful, encouraging, and natural paragraph. You get deeply personalized notes with just a few bullet words.

### 5. **✨ Quick Autofill (Great Class) in 1-Click**
* **What it does**: Next to the checklist header, click the **"Quick Autofill (Great Class)"** button.
* **How it helps**: For your excellent students, this button automatically checks all standard positive indicators (arrived on time, mic working, cheerful attitude, spoke confidently, clear pronunciation) in a single click.

### 6. **Complete History CRUD (Edit & Delete on the Fly)**
* **What it does**: If you view past records under the **Observation History** tab, you can click **Edit Record** to modify the student's name, lesson name, class date, or tweak the written feedback paragraph directly. You can also delete older records.
* **How it helps**: Gives you complete control. You can fix mistakes in history or clean up old drafts easily.

### 7. **Robust Automatic Backup (Cloud & Local Storage)**
* **What it does**: The system saves your logs safely to the cloud database. If your internet is spotty or the database is disconnected, it **automatically backs up to your browser's local storage**.
* **How it helps**: You never lose your feedback! The History page seamlessly merges both database and local backups into one unified list, complete with "Cloud" and "Local" badges.

---

## 🚀 Quick Setup & How to Start

### 📋 Prerequisites
1. **Gemini API Key**: Retrieve a free key from Google AI Studio.
2. **Supabase Database**: Ensure a postgres table `feedback_records` is created in Supabase (SQL schema is located in `ESL_Feedback_Generator_Brief.md`).

### ⚙️ Step 1: Environment Setup
1. Edit the backend [server .env file](file:///c:/Users/ACER%20ASPIRE/OneDrive/Documents/ESL_Zizza/server/.env) and insert your keys:
   ```env
   GEMINI_API_KEY=your_gemini_key_here
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_secret_service_key
   ```

### 💻 Step 2: Running the Servers

#### **Express Backend**
Open a terminal in the `/server` folder and run:
```bash
npm run dev
```

#### **Vite React Frontend**
Open a terminal in the `/client` folder and run:
```bash
npm run dev
```

Open your browser and navigate to **[http://localhost:5173](http://localhost:5173)** to start generating feedback!
