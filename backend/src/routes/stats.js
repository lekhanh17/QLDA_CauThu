import { Router } from "express";
import { getPool, sql } from "../db.js";

const router = Router();

/* --- CN08: cầu thủ có giá trị tăng mạnh nhất --------------------------------
   ROW_NUMBER hai chieu de lay lan dinh gia DAU TIEN va CUOI CUNG
   cua moi cau thu chi bang mot lan quet bang.
   --------------------------------------------------------------------- */
router.get("/top-growth", async (req, res) => {
  try {
    const limit = Math.min(50, Number(req.query.limit) || 10);
    const pool = await getPool();
    const r = await pool.request()
      .input("limit", sql.Int, limit)
      .query(`
        WITH xep AS (
          SELECT player_id, market_value_in_eur, valuation_date,
                 ROW_NUMBER() OVER (PARTITION BY player_id ORDER BY valuation_date ASC)  AS rn_dau,
                 ROW_NUMBER() OVER (PARTITION BY player_id ORDER BY valuation_date DESC) AS rn_cuoi
          FROM player_valuations
        ),
        gia AS (
          SELECT player_id,
                 MAX(CASE WHEN rn_dau  = 1 THEN market_value_in_eur END) AS gia_dau,
                 MAX(CASE WHEN rn_cuoi = 1 THEN market_value_in_eur END) AS gia_cuoi,
                 MIN(CASE WHEN rn_dau  = 1 THEN valuation_date END)      AS ngay_dau
          FROM xep
          WHERE rn_dau = 1 OR rn_cuoi = 1
          GROUP BY player_id
        )
        SELECT TOP (@limit)
               p.player_id, p.name, p.[position], p.current_club_name,
               g.ngay_dau,
               CAST(g.gia_dau  AS FLOAT) AS gia_dau,
               CAST(g.gia_cuoi AS FLOAT) AS gia_cuoi,
               CAST(g.gia_cuoi - g.gia_dau AS FLOAT) AS muc_tang,
               CAST(ROUND((g.gia_cuoi - g.gia_dau) * 100.0 / g.gia_dau, 1) AS FLOAT) AS phan_tram
        FROM gia g
        JOIN players p ON p.player_id = g.player_id
        WHERE g.gia_dau > 0
        ORDER BY (g.gia_cuoi - g.gia_dau) DESC;
      `);
    res.json(r.recordset);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Không đọc được thống kê tăng giá" });
  }
});

/* --- Tổng quan toàn bộ hệ thống, dùng cho HomePage --------------------- */
router.get("/overview", async (req, res) => {
  try {
    const pool = await getPool();
    const r = await pool.request().query(`
      SELECT (SELECT COUNT(*) FROM players)           AS so_cau_thu,
             (SELECT COUNT(*) FROM clubs)             AS so_clb,
             (SELECT COUNT(*) FROM transfers)         AS so_chuyen_nhuong,
             (SELECT COUNT(*) FROM player_valuations) AS so_lan_dinh_gia,
             (SELECT CAST(AVG(CAST(market_value_in_eur AS FLOAT)) AS FLOAT)
              FROM players WHERE market_value_in_eur IS NOT NULL) AS gia_tri_trung_binh;
    `);
    res.json(r.recordset[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Không đọc được thống kê tổng quan" });
  }
});

export default router;