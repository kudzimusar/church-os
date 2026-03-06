# 🕊️ Church OS: The Digital Sanctuary & Intelligence Platform

[![Next.js](https://img.shields.io/badge/Next.js-15+-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/DB-Supabase-3ecf8e?logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Style-Tailwind_4-06b6d4?logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-Proprietary-red)](#)

**Church OS** is an enterprise-grade, high-performance spiritual infrastructure designed for **Japan Kingdom Church (JKC)**. Built to facilitate the "90 Days of Transformation" journey, it merges daily devotional habits with high-fidelity pastoral intelligence.

---

## 🌌 System Vision
Traditional church management systems are reactive spreadsheets. **Church OS is a proactive shepherd.** It uses AI and data science to predict when members are drifting, identifies geographic growth opportunities across Tokyo, and bridges language barriers in a truly international congregation.

---

## 📖 1. The Devotion Engine (Member Experience)
A high-engagement Progressive Web App (PWA) that serves as the daily spiritual hub for the congregation.

### **Daily Spiritual Interface**
*   **Dynamic Transformation Ring**: An SVG-based progress visualization that fills as members complete the 90-day curriculum.
*   **AI Hero Greetings**: Context-aware messages (via `AIService`) that adapt based on a member's current streak and completion status.
*   **Bilingual Scripture Delivery**: Integrated with the **Bolls Bible API** providing instant toggles between English (NASB) and Japanese (口語訳 - JBS).
*   **Ask Bible Chat**: A context-bounded AI assistant that allows members to query the day's specific scripture for cultural, historical, or practical insights.

### **The SOAP Journaling System**
*   **Structured Reflection**: Fields for **S**cripture, **O**bservation, **A**pplication, and **P**rayer.
*   **Stealth Sentiment Analysis**: Member "Observations" are analyzed by AI to detect emotional trends (Hope, Anxiety, Joy) without violating privacy.
*   **Gamified Consistency**: Real-time "Day Streaks" and rewards to encourage consistency in the secret place.

---

## 🛡️ 2. Shepherd Dashboard (Mission Control)
A sophisticated administrative layer for Pastors, Elders, and Ministry Leaders.

### **Operational Intelligence**
*   **Engagement Score (0-100)**: A proprietary index weighting devotion completion, service attendance, and ministry activity.
*   **Care Alerts Radar**: 
    *   **🔴 Critical**: Members inactive for >14 days.
    *   **🟡 Warning**: Members inactive for >7 days.
*   **Counseling Queue**: Management system for spiritual, marriage, and financial guidance requests with categorized urgency.

### **Ministry & Resource Management**
*   **Ministry Staffing Analysis**: Compares the technical/spiritual skills members have (from their profile) against current ministry needs.
*   **Fellowship Circles**: Proximity-based group management helping members connect in their local wards.
*   **Growth Intelligence**: Funnel visualization tracking the Discipleship Pipeline:
    *   `Invited Visitor` → `First Service` → `Second Visit` → `Salvation` → `Baptism` → `Membership`.

---

## 📊 3. Data Analytics & Spiritual Intelligence
The "Intelligence Layer" that turns database rows into pastoral wisdom.

### **Collective Pulse Analysis**
*   **Sentiment Modeling**: Aggregate visualization of the church's emotional health based on anonymized SOAP journals.
*   **Theme Pulse**: A word cloud of the most mentioned spiritual concepts in the congregation each week.

### **Spatial Strategy**
*   **Geographic Clustering**: Density mapping of members across **Tokyo Wards (Nerima, Setagaya, Adachi, etc.)**.
*   **Locality Analysis**: Identifying "Dark Spots" where the church has no presence and "Hot Spots" where a new fellowship group should be planted.

---

## 🤖 4. Model Context Protocol (MCP) Integration
A cutting-edge AI bridge that allows external agents (like Claude Desktop) to interact with the church's knowledge base.

*   **Secure Retrieval**: Uses the `search_devotions` and `get_weekly_overview` tools to query the 90-day library.
*   **Pastoral Research**: Supports sermon preparation by analyzing church-wide trends while maintaining strict anonymity for journaling.

---

## 🛠️ Technology Stack & Architecture

### **Frontend & Framework**
- **Next.js 15+**: App Router for modern server-side rendering and routing.
- **TypeScript**: Radical type safety across the entire data layer.
- **Tailwind CSS v4**: Ultra-modern styling with custom design tokens for "Weekly Themes."
- **Framer Motion**: Smooth, high-fidelity micro-interactions for a premium feel.

### **Backend & Security**
- **Supabase (PostgreSQL)**: The heart of our data processing.
- **Row Level Security (RLS)**: Enforces that journal entries and private profile data are only accessible by the owner.
- **Security Middleware**: Custom API-key-based guard with domain whitelisting and usage tracking.

### **External Integrations**
- **Bolls Bible API**: Real-time passage retrieval.
- **AI Services**: Custom wrappers for OpenAI/Gemini for sentiment analysis and the Bible Chat.
- **Stripe Integration**: Mocked architecture ready for financial stewardship (Tithes/Offerings).

---

## ⚙️ SaaS & Scalability
Church OS is built to scale beyond a single location:
*   **Multi-Branch Onboarding**: A dedicated wizard for registering new churches, domains, and subscription tiers.
*   **SaaS Tiers**: Lite, Pro, and Enterprise configurations with varying feature sets.
*   **Organization Isolation**: Middleware ensures no data leakage between different church organizations.

---

## 🏁 Getting Started

### **Environment Setup**
Create a `.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=... # For Shepherd Admin Access
MCP_API_KEY=... # For AI Tool Integration
```

### **Deployment**
```bash
npm install
npm run build
npm run start
```

---

## 📜 Full Documentation
For the minute operational details of every feature, refer to the [Full Operations Manual](file:///Users/shadreckmusarurwa/Project%20AI/jkc-devotion-app/docs/church_os_manual.md).

---

Built with reverence for the ministry of **Japan Kingdom Church**.
**Version 3.0.0 - Digital Transformation for the Kingdom.**
