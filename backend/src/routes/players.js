import { Router } from "express";
import { getPool, sql } from "../db.js";

const router = Router();

/* --- CN04 + CN05 + CN07: tim kiem, loc, xep hang --------------------
   Mot endpoint phuc vu ca ba chuc nang.
   Vi du: /api/players?q=saka&position=Attack&sort=value_desc&page=1
   ------------------------------------------------------------------- */
router.get("/", async (req, res) => {
  try {
    const { q, position, country, league, ageMin, ageMax } = req.query;
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(100, Number(req.query.pageSize) || 20);

    const sorts = {
      value_desc: "p.market_value_in_eur DESC",
      value_asc:  "p.market_value_in_eur ASC",
      name:       "p.name ASC",
      age:        "p.date_of_birth DESC"
    };
    const orderBy = sorts[req.query.sort] || sorts.value_desc;

    const pool = await getPool();
    const rq = pool.request();
    const where = ["p.market_value_in_eur IS NOT NULL"];

    if (q)        { rq.input("q", sql.NVarChar, `%${q}%`);        where.push("p.name LIKE @q"); }
    if (position) { rq.input("pos", sql.NVarChar, position);      where.push("p.[position] = @pos"); }
    if (country)  { rq.input("ctry", sql.NVarChar, country);      where.push("p.country_of_citizenship = @ctry"); }
    if (league)   { rq.input("lg", sql.NVarChar, league);         where.push("p.current_club_domestic_competition_id = @lg"); }
    if (ageMin)   { rq.input("amin", sql.Int, Number(ageMin));    where.push("p.date_of_birth <= DATEADD(YEAR, -@amin, GETDATE())"); }
    if (ageMax)   { rq.input("amax", sql.Int, Number(ageMax));    where.push("p.date_of_birth >= DATEADD(YEAR, -@amax - 1, GETDATE())"); }

    rq.input("offset", sql.Int, (page - 1) * pageSize);
    rq.input("take", sql.Int, pageSize);

    const clause = "WHERE " + where.join(" AND ");

    const result = await rq.query(`
      SELECT COUNT(*) AS total FROM players p ${clause};

      SELECT p.player_id,
             p.name,
             p.[position],
             p.sub_position,
             p.country_of_citizenship,
             p.current_club_name,
             p.current_club_domestic_competition_id,
             DATEDIFF(YEAR, p.date_of_birth, GETDATE()) AS tuoi,
             CAST(p.market_value_in_eur AS FLOAT) AS market_value_in_eur
      FROM players p
      ${clause}
      ORDER BY ${orderBy}
      OFFSET @offset ROWS FETCH NEXT @take ROWS ONLY;
    `);

    res.json({
      total: result.recordsets[0][0].total,
      page,
      pageSize,
      items: result.recordsets[1]
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Khong doc duoc danh sach cau thu" });
  }
});

/* --- Danh sach gia tri cho cac o loc ben Frontend -------------------- */
router.get("/filter-options", async (req, res) => {
  try {
    const pool = await getPool();
    const r = await pool.request().query(`
      SELECT DISTINCT [position] AS value FROM players
      WHERE [position] IS NOT NULL ORDER BY value;

      SELECT DISTINCT country_of_citizenship AS value FROM players
      WHERE country_of_citizenship IS NOT NULL ORDER BY value;

      SELECT c.competition_id AS value, c.name
      FROM competitions c
      WHERE EXISTS (SELECT 1 FROM players p
                    WHERE p.current_club_domestic_competition_id = c.competition_id)
      ORDER BY c.name;
    `);
    res.json({
      positions: r.recordsets[0].map(x => x.value),
      countries: r.recordsets[1].map(x => x.value),
      leagues:   r.recordsets[2]
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Không đọc được danh sách bộ lọc" });
  }
});

/* --- CN07: so sanh nhieu cau thu -------------------------------------
   Vi du: /api/players/compare?ids=1012564,418560,8198
   STRING_SPLIT tach chuoi id thanh bang, van tham so hoa an toan.
   --------------------------------------------------------------------- */
router.get("/compare", async (req, res) => {
  try {
    const raw = String(req.query.ids || "");
    const ids = raw.split(",").map(s => Number(s.trim())).filter(Number.isInteger);

    if (ids.length < 2) return res.status(400).json({ error: "Can it nhat 2 player_id" });
    if (ids.length > 6) return res.status(400).json({ error: "Toi da 6 cau thu" });

    const pool = await getPool();
    const r = await pool.request()
      .input("ids", sql.NVarChar, ids.join(","))
      .query(`
        DECLARE @ds TABLE (player_id INT);
        INSERT INTO @ds SELECT CAST(value AS INT) FROM STRING_SPLIT(@ids, ',');

        SELECT p.player_id, p.name, p.[position], p.sub_position,
               p.country_of_citizenship, p.current_club_name, p.image_url,
               DATEDIFF(YEAR, p.date_of_birth, GETDATE()) AS tuoi,
               p.height_in_cm, p.foot,
               CAST(p.market_value_in_eur AS FLOAT)         AS gia_hien_tai,
               CAST(p.highest_market_value_in_eur AS FLOAT) AS gia_cao_nhat,
               ISNULL(a.so_tran, 0)   AS so_tran,
               ISNULL(a.ban_thang, 0) AS ban_thang,
               ISNULL(a.kien_tao, 0)  AS kien_tao,
               ISNULL(a.so_phut, 0)   AS so_phut,
               CASE WHEN ISNULL(a.so_phut, 0) > 0
                    THEN CAST(ROUND(a.ban_thang * 90.0 / a.so_phut, 2) AS FLOAT)
                    ELSE 0 END AS ban_thang_moi_90p,
               ISNULL(t.so_lan_chuyen_nhuong, 0) AS so_lan_chuyen_nhuong
        FROM players p
        JOIN @ds d ON d.player_id = p.player_id
        LEFT JOIN (
          SELECT player_id,
                 COUNT(*)            AS so_tran,
                 SUM(goals)          AS ban_thang,
                 SUM(assists)        AS kien_tao,
                 SUM(minutes_played) AS so_phut
          FROM appearances
          WHERE player_id IN (SELECT player_id FROM @ds)
          GROUP BY player_id
        ) a ON a.player_id = p.player_id
        LEFT JOIN (
          SELECT player_id, COUNT(*) AS so_lan_chuyen_nhuong
          FROM transfers
          WHERE player_id IN (SELECT player_id FROM @ds)
          GROUP BY player_id
        ) t ON t.player_id = p.player_id;
      `);

    res.json({ so_luong: r.recordset.length, cau_thu: r.recordset });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Khong so sanh duoc cau thu" });
  }
});

/* --- CN08: Biến động giá trị 1 cầu thủ -----------------------------
   LAG lấy giá trị của lan dinh gia LIEN TRUOC trong cung cau thu,
   nho vay tinh duoc muc tang giam ngay trong SQL.
   --------------------------------------------------------------------- */
router.get("/:id/valuations", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: "player_id không hợp lệ" });

    const pool = await getPool();
    const r = await pool.request()
      .input("id", sql.Int, id)
      .query(`
        WITH lich_su AS (
          SELECT valuation_date,
                 market_value_in_eur AS gia_tri,
                 current_club_name,
                 player_club_domestic_competition_id AS ma_giai,
                 LAG(market_value_in_eur) OVER (ORDER BY valuation_date) AS gia_truoc
          FROM player_valuations
          WHERE player_id = @id
        )
        SELECT valuation_date,
               CAST(gia_tri AS FLOAT)  AS gia_tri,
               current_club_name,
               ma_giai,
               CAST(gia_truoc AS FLOAT) AS gia_truoc,
               CAST(gia_tri - gia_truoc AS FLOAT) AS thay_doi,
               CASE WHEN gia_truoc > 0
                    THEN CAST(ROUND((gia_tri - gia_truoc) * 100.0 / gia_truoc, 1) AS FLOAT)
               END AS phan_tram,
               CASE WHEN MONTH(valuation_date) >= 7
                    THEN CONCAT(YEAR(valuation_date), '/', RIGHT(YEAR(valuation_date) + 1, 2))
                    ELSE CONCAT(YEAR(valuation_date) - 1, '/', RIGHT(YEAR(valuation_date), 2))
               END AS mua_giai
        FROM lich_su
        ORDER BY valuation_date;

        SELECT COUNT(*) AS so_lan_dinh_gia,
               CAST(MIN(market_value_in_eur) AS FLOAT) AS gia_thap_nhat,
               CAST(MAX(market_value_in_eur) AS FLOAT) AS gia_cao_nhat,
               MIN(valuation_date) AS ngay_dau,
               MAX(valuation_date) AS ngay_cuoi
        FROM player_valuations
        WHERE player_id = @id;
      `);

    const diem = r.recordsets[0];
    if (!diem.length) return res.status(404).json({ error: "Cau thu chua co du lieu dinh gia" });

    const tom_tat = r.recordsets[1][0];
    const dau = diem[0].gia_tri;
    const cuoi = diem[diem.length - 1].gia_tri;

    res.json({
      player_id: id,
      tom_tat: {
        ...tom_tat,
        gia_dau_tien: dau,
        gia_hien_tai: cuoi,
        muc_tang: cuoi - dau,
        phan_tram_tang: dau > 0 ? Number(((cuoi - dau) * 100 / dau).toFixed(1)) : null
      },
      diem_du_lieu: diem
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Không đọc được lịch sử giá trị" });
  }
});

/* --- CN06: Hồ sơ chi tiết 1 cầu thủ -------------------------------- */
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: "player_id không hợp lệ" });

    const pool = await getPool();
    const r = await pool.request()
      .input("id", sql.Int, id)
      .query(`
        SELECT p.player_id, p.name, p.[position], p.sub_position, p.foot,
               p.height_in_cm, p.date_of_birth,
               DATEDIFF(YEAR, p.date_of_birth, GETDATE()) AS tuoi,
               p.country_of_birth, p.country_of_citizenship,
               p.contract_expiration_date, p.agent_name, p.image_url,
               p.current_club_id, p.current_club_name,
               c.domestic_competition_id, comp.name AS ten_giai_dau,
               CAST(p.market_value_in_eur AS FLOAT) AS market_value_in_eur,
               CAST(p.highest_market_value_in_eur AS FLOAT) AS highest_market_value_in_eur
        FROM players p
        LEFT JOIN clubs c ON c.club_id = p.current_club_id
        LEFT JOIN competitions comp ON comp.competition_id = c.domestic_competition_id
        WHERE p.player_id = @id;

        SELECT t.transfer_date, t.transfer_season,
               t.from_club_name, t.to_club_name,
               CAST(t.transfer_fee AS FLOAT) AS transfer_fee,
               CAST(t.market_value_in_eur AS FLOAT) AS market_value_in_eur
        FROM transfers t
        WHERE t.player_id = @id
        ORDER BY t.transfer_date DESC;

        SELECT COUNT(*) AS so_tran,
               SUM(a.goals) AS ban_thang,
               SUM(a.assists) AS kien_tao,
               SUM(a.minutes_played) AS so_phut
        FROM appearances a
        WHERE a.player_id = @id;
      `);

    if (!r.recordsets[0].length) return res.status(404).json({ error: "Không tìm thấy cầu thủ" });

    res.json({
      ...r.recordsets[0][0],
      chuyen_nhuong: r.recordsets[1],
      thong_so: r.recordsets[2][0]
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Khong doc duoc ho so cau thu" });
  }
});

export default router;