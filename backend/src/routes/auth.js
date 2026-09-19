import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getPool, sql } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

function kyToken(u) {
  return jwt.sign(
    { user_id: u.user_id, email: u.email, role: u.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES || "7d" }
  );
}

/* --- CN01: đăng ký ---------------------------------------------------- */
router.post("/register", async (req, res) => {
  try {
    const { email, password, full_name } = req.body || {};

    if (!email || !/^\S+@\S+\.\S+$/.test(email))
      return res.status(400).json({ error: "Email không hợp lệ" });
    if (!password || password.length < 6)
      return res.status(400).json({ error: "Mật khẩu phải trên 6 ký tự" });

    const pool = await getPool();

    const trung = await pool.request()
      .input("email", sql.NVarChar, email)
      .query("SELECT 1 FROM users WHERE email = @email");
    if (trung.recordset.length)
      return res.status(409).json({ error: "Email đã được đăng ký" });

    const hash = await bcrypt.hash(password, 10);

    const r = await pool.request()
      .input("email", sql.NVarChar, email)
      .input("hash", sql.NVarChar, hash)
      .input("ten", sql.NVarChar, full_name || null)
      .query(`
        INSERT INTO users (email, password_hash, full_name, role)
        OUTPUT INSERTED.user_id, INSERTED.email, INSERTED.full_name, INSERTED.role
        VALUES (@email, @hash, @ten, 'user');
      `);

    const u = r.recordset[0];
    res.status(201).json({ token: kyToken(u), user: u });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Không đăng ký được" });
  }
});

/* --- CN02: đăng nhập -------------------------------------------------- */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password)
      return res.status(400).json({ error: "Thiếu email hoặc mật khẩu" });

    const pool = await getPool();
    const r = await pool.request()
      .input("email", sql.NVarChar, email)
      .query("SELECT user_id, email, password_hash, full_name, role FROM users WHERE email = @email");

    const u = r.recordset[0];
    // Bao loi chung cho ca hai truong hop, tranh lo email nao da ton tai
    if (!u || !(await bcrypt.compare(password, u.password_hash)))
      return res.status(401).json({ error: "Email hoặc mật khẩu không đúng" });

    const { password_hash, ...cong_khai } = u;
    res.json({ token: kyToken(u), user: cong_khai });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Không đăng nhập được" });
  }
});

/* --- CN03: đăng xuất -------------------------------------------------- */
router.post("/logout", requireAuth, (req, res) => {
  res.json({ message: "Đã đăng xuất" });
});

/* --- Kiểm tra phiên hiện tại, FE gọi khi tải lại trang ---------- */
router.get("/me", requireAuth, async (req, res) => {
  const pool = await getPool();
  const r = await pool.request()
    .input("id", sql.Int, req.user.user_id)
    .query("SELECT user_id, email, full_name, role, created_at FROM users WHERE user_id = @id");
  if (!r.recordset.length) return res.status(404).json({ error: "Không tìm thấy tài khoản" });
  res.json(r.recordset[0]);
});

export default router;