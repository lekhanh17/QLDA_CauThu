import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { dinhDangTien, dinhDangNgay } from "../utils/format.js";

const MAU = "#0d7a3e";

function GoiY({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div
      style={{
        background: "var(--canvas)",
        border: "1px solid var(--hairline)",
        borderRadius: "var(--r-md)",
        padding: "var(--s-md) var(--s-lg)",
        minWidth: 180,
      }}
    >
      <div className="t-caption">{dinhDangNgay(d.ngay)}</div>
      <div
        style={{
          fontSize: 20,
          fontWeight: 600,
          color: "var(--ink)",
          margin: "2px 0 4px",
        }}
      >
        {dinhDangTien(d.gia_tri)}
      </div>
      <div className="t-sm">{d.clb}</div>
      {d.thay_doi != null && d.thay_doi !== 0 && (
        <div
          className={d.thay_doi > 0 ? "delta-up" : "delta-down"}
          style={{ fontSize: 13, marginTop: 4 }}
        >
          {d.thay_doi > 0 ? "▲" : "▼"} {dinhDangTien(Math.abs(d.thay_doi))}
        </div>
      )}
    </div>
  );
}

export default function ValueChart({ diem }) {
  const data = (diem || []).map((d) => ({
    ts: new Date(d.valuation_date).getTime(),
    ngay: d.valuation_date,
    gia_tri: d.gia_tri,
    clb: d.current_club_name,
    thay_doi: d.thay_doi,
  }));

  if (data.length === 0)
    return <div className="t-sm">Chua co du lieu dinh gia.</div>;
    // Nhieu diem thi an cham di, de duong lien mach
  const hienCham = data.length <= 15

  return (
    <ResponsiveContainer width="100%" height={340}>
      <AreaChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--hairline-soft)" />

        <XAxis
          dataKey="ts"
          type="number"
          scale="time"
          domain={["dataMin", "dataMax"]}
          tickFormatter={(ts) => new Date(ts).getFullYear()}
          tick={{ fill: "var(--mute)", fontSize: 12 }}
          tickLine={false}
          axisLine={{ stroke: "var(--hairline)" }}
          minTickGap={32}
        />

        <YAxis
          tickFormatter={dinhDangTien}
          tick={{ fill: "var(--mute)", fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          width={76}
        />

        <Tooltip
          content={<GoiY />}
          cursor={{ stroke: "var(--stone)", strokeWidth: 1 }}
        />

        <Area
          type="linear"
          dataKey="gia_tri"
          stroke={MAU}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill={MAU}
          fillOpacity={0.1}
            dot={hienCham ? { r: 4, fill: MAU, stroke: 'var(--canvas)', strokeWidth: 2 } : false}
          activeDot={{
            r: 6,
            fill: MAU,
            stroke: "var(--canvas)",
            strokeWidth: 2,
          }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
