# AI Strategy & Architecture

## 1. The Role of AI in HabitFlow
AI is not a chat-bot bolted onto the side of the app. It is an ambient intelligence layer that observes user behavior and provides actionable, highly contextual insights.

### 1.1 The "AI Coach"
- **Trigger:** Sunday Weekly Review.
- **Input:** Aggregated weekly data (Task completion %, Habit streaks broken/maintained, average Mood score, free-text reflections).
- **Output:** A personalized 3-paragraph summary:
  1. **Validation:** Acknowledging wins.
  2. **Analysis:** Correlating data (e.g., "Your mood dropped on Thursday when you missed your workout habit").
  3. **Action:** A specific, micro-adjustment for next week.

## 2. Technical Implementation

### 2.1 Prompt Engineering (Zero-Shot & Few-Shot)
We use highly structured JSON outputs from the LLM to render native UI components (e.g., returning an array of "Warning Flags" that we map to red UI badges).

**Example System Prompt snippet:**
```text
You are HabitFlow, an elite behavioral science AI coach.
Analyze the user's weekly metrics: {metrics}.
Output your analysis in strict JSON matching the following schema...
```

### 2.2 Privacy & Edge AI Future
Currently, we rely on cloud LLMs (via API endpoints). 
**Future Roadmap (Phase 10):**
- Implement **WebGPU / WebNN** with small models (e.g., Llama 3 8B or Phi-3) running directly in the user's browser.
- This ensures 100% privacy, zero server costs for inference, and fully offline AI coaching.

## 3. Fallback Mechanisms
If the AI API is down or the user is offline, the app defaults to deterministic algorithmic insights (e.g., standard "You completed 80% of your habits" messages) so the Weekly Review flow never breaks.
