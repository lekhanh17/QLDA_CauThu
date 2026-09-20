USE QLDA_CauThu;
GO

/* --- Buoc 1: tao lai bang tam --- */
IF OBJECT_ID('stg_transfers','U') IS NOT NULL DROP TABLE stg_transfers;

CREATE TABLE stg_transfers (
    player_id           NVARCHAR(50),
    transfer_date       NVARCHAR(50),
    transfer_season     NVARCHAR(50),
    from_club_id        NVARCHAR(50),
    to_club_id          NVARCHAR(50),
    from_club_name      NVARCHAR(200),
    to_club_name        NVARCHAR(200),
    transfer_fee        NVARCHAR(50),
    market_value_in_eur NVARCHAR(50),
    player_name         NVARCHAR(200)
);
GO

/* --- Buoc 2: nap lai CSV (175.165 dong, cho khoang 10-30 giay) --- */
BULK INSERT stg_transfers FROM 'F:\dulieu\transfers.csv'
WITH (FORMAT='CSV', FIRSTROW=2, FIELDQUOTE='"', FIELDTERMINATOR=',',
      ROWTERMINATOR='0x0a', CODEPAGE='65001', TABLOCK);
GO

/* --- Buoc 3: cap nhat 2 cot bi thieu, ep kieu 2 lan --- */
UPDATE t
SET t.transfer_fee =
        TRY_CAST(TRY_CAST(NULLIF(LTRIM(RTRIM(s.transfer_fee)), '') AS DECIMAL(20,3)) AS BIGINT),
    t.market_value_in_eur =
        TRY_CAST(TRY_CAST(NULLIF(LTRIM(RTRIM(s.market_value_in_eur)), '') AS DECIMAL(20,3)) AS BIGINT)
FROM transfers t
JOIN stg_transfers s
  ON  s.player_id  = CAST(t.player_id  AS NVARCHAR(50))
  AND s.to_club_id = CAST(t.to_club_id AS NVARCHAR(50))
  AND TRY_CAST(s.transfer_date AS DATE) = CAST(t.transfer_date AS DATE);
GO

/* --- Buoc 4: kiem tra --- */
SELECT COUNT(*)                   AS tong_dong,
       COUNT(transfer_fee)        AS co_phi,
       COUNT(market_value_in_eur) AS co_dinh_gia
FROM transfers;

SELECT TOP 10 transfer_date, from_club_name, to_club_name, transfer_fee
FROM transfers
WHERE transfer_fee > 0
ORDER BY transfer_fee DESC;
GO

/* --- Buoc 5: don dep --- */
DROP TABLE stg_transfers;
GO