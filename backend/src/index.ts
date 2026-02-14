import express from "express";

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(express.json());

// Health check for Railway
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Placeholder routes — implement later:
// - Scrape: fetch content from sources
// - Generate: AI newsletter generation
// - Send: schedule/send emails at user-specified time

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
