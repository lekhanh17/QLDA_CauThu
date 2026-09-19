import express from "express";
import cors from "cors";
import "dotenv/config";
import { getPool } from "./db.js";
import playersRouter from "./routes/players.js";
import statsRouter from "./routes/stats.js";
import authRouter from "./routes/auth.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", async (req, res) => {
  try {
    const pool = await getPool();
    const r = await pool.request().query("SELECT 1 AS ok");
    res.json({ ok: r.recordset[0].ok === 1 });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.use("/api/players", playersRouter);
app.use("/api/stats", statsRouter);
app.use("/api/auth", authRouter);

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`API chay tai http://localhost:${port}`));