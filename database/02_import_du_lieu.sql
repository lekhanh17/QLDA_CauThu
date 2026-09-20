/* =====================================================================
   QLDA - HE THONG THEO DOI GIA TRI CHUYEN NHUONG CAU THU
   File 02: Import du lieu tu CSV vao SQL Server
   ---------------------------------------------------------------------
   DIEU KIEN: da chay xong PHAN 1, 2, 3 cua file 01_tao_bang.sql
   DUONG DAN CSV: F:\dulieu\   (sua o BUOC 1 neu dat cho khac)

   NGUYEN TAC LOC (da chot):
     Loc theo player_id, KHONG loc theo giai dau.
     Lay danh sach cau thu Ngoai hang Anh lam goc, roi keo TOAN BO
     lich su cua ho ve - ke ca giai doan thi dau ngoai Anh.
     Neu loc theo giai, bieu do bien dong gia tri se bi cut doan.

   THU TU CHAY: tung BUOC mot, boi den roi F5. Dung chay ca file.

   !!! QUYEN CHAY !!!
   BULK INSERT can quyen cap may chu (ADMINISTER BULK OPERATIONS).
   Phai ket noi bang tai khoan quan tri (Windows Authentication),
   KHONG dung tai khoan qlda_app. Tai khoan qlda_app chi danh cho
   ung dung web va co dung quyen doc/ghi bang - do la chu y.

   !!! EP KIEU SO - BAI HOC QUAN TRONG !!!
   TRY_CAST tu chuoi co dau cham thap phan sang so nguyen tra ve NULL
   ma KHONG bao loi:

       SELECT TRY_CAST('25000.000' AS BIGINT);   -- NULL
       SELECT TRY_CAST('25000'     AS BIGINT);   -- 25000

   File CSV sinh tu pandas ghi cot so nguyen co o trong thanh dang
   thap phan ('25000.000'). Vi vay moi cot so trong file nay deu ep
   hai buoc: chuoi -> DECIMAL(20,3) -> INT/BIGINT.
   Lan dau lam thieu buoc nay da mat 113.639 gia tri phi chuyen nhuong.

   !!! CANH BAO KHI CHAY LAI !!!
   File nay thiet ke cho lan chay DAU TIEN, luc chua co khoa ngoai.
   Neu da chay PHAN 4 cua file 01 roi ma muon import lai, phai go
   khoa ngoai truoc bang khoi lenh o cuoi file (BUOC 8), neu khong
   cac lenh DELETE se bao loi.
   Import xong thi chay lai PHAN 4 de tao lai khoa ngoai.
   ===================================================================== */

USE QLDA_CauThu;
GO


/* =====================================================================
   BUOC 1 - NAP CSV VAO BANG STAGING

   FORMAT='CSV' + FIELDQUOTE='"' de SQL Server hieu dung dau nhay kep.
   Bat buoc phai co, vi ten cau thu va ten CLB co chua dau phay.
   CODEPAGE='65001' la UTF-8, giu dung dau cua ten nuoc ngoai.
   TABLOCK giup nap nhanh hon nhieu lan.

   File appearances.csv nang nhat, co the mat vai phut. Cu de chay.
   ===================================================================== */

TRUNCATE TABLE stg_competitions;
TRUNCATE TABLE stg_clubs;
TRUNCATE TABLE stg_players;
TRUNCATE TABLE stg_player_valuations;
TRUNCATE TABLE stg_transfers;
TRUNCATE TABLE stg_appearances;
GO

BULK INSERT stg_competitions FROM 'F:\dulieu\competitions.csv'
WITH (FORMAT='CSV', FIRSTROW=2, FIELDQUOTE='"', FIELDTERMINATOR=',',
      ROWTERMINATOR='0x0a', CODEPAGE='65001', TABLOCK);
GO

BULK INSERT stg_clubs FROM 'F:\dulieu\clubs.csv'
WITH (FORMAT='CSV', FIRSTROW=2, FIELDQUOTE='"', FIELDTERMINATOR=',',
      ROWTERMINATOR='0x0a', CODEPAGE='65001', TABLOCK);
GO

BULK INSERT stg_players FROM 'F:\dulieu\players.csv'
WITH (FORMAT='CSV', FIRSTROW=2, FIELDQUOTE='"', FIELDTERMINATOR=',',
      ROWTERMINATOR='0x0a', CODEPAGE='65001', TABLOCK);
GO

BULK INSERT stg_player_valuations FROM 'F:\dulieu\player_valuations.csv'
WITH (FORMAT='CSV', FIRSTROW=2, FIELDQUOTE='"', FIELDTERMINATOR=',',
      ROWTERMINATOR='0x0a', CODEPAGE='65001', TABLOCK);
GO

BULK INSERT stg_transfers FROM 'F:\dulieu\transfers.csv'
WITH (FORMAT='CSV', FIRSTROW=2, FIELDQUOTE='"', FIELDTERMINATOR=',',
      ROWTERMINATOR='0x0a', CODEPAGE='65001', TABLOCK);
GO

BULK INSERT stg_appearances FROM 'F:\dulieu\appearances.csv'
WITH (FORMAT='CSV', FIRSTROW=2, FIELDQUOTE='"', FIELDTERMINATOR=',',
      ROWTERMINATOR='0x0a', CODEPAGE='65001', TABLOCK);
GO

/* --- Xoa ky tu xuong dong thua o cot CUOI cung -----------------------
   Neu file CSV dung kieu xuong dong Windows (CRLF), cot cuoi se dinh
   them ky tu CHAR(13). Lenh duoi xoa no di. Chay khong hai gi ke ca
   khi file khong co ky tu do.
   --------------------------------------------------------------------- */
UPDATE stg_competitions      SET url = REPLACE(url, CHAR(13), '');
UPDATE stg_clubs             SET url = REPLACE(url, CHAR(13), '');
UPDATE stg_players           SET highest_market_value_in_eur = REPLACE(highest_market_value_in_eur, CHAR(13), '');
UPDATE stg_player_valuations SET player_club_domestic_competition_id = REPLACE(player_club_domestic_competition_id, CHAR(13), '');
UPDATE stg_transfers         SET player_name = REPLACE(player_name, CHAR(13), '');
UPDATE stg_appearances       SET minutes_played = REPLACE(minutes_played, CHAR(13), '');
GO

/* --- Kiem tra da nap duoc bao nhieu dong ----------------------------- */
SELECT 'stg_competitions'      AS bang, COUNT(*) AS so_dong FROM stg_competitions
UNION ALL SELECT 'stg_clubs',             COUNT(*) FROM stg_clubs
UNION ALL SELECT 'stg_players',           COUNT(*) FROM stg_players
UNION ALL SELECT 'stg_player_valuations', COUNT(*) FROM stg_player_valuations
UNION ALL SELECT 'stg_transfers',         COUNT(*) FROM stg_transfers
UNION ALL SELECT 'stg_appearances',       COUNT(*) FROM stg_appearances;
GO


/* =====================================================================
   BUOC 2 - CHOT DANH SACH CAU THU NGOAI HANG ANH

   Day la buoc duy nhat dung dieu kien 'GB1'.
   Tat ca cac buoc sau chi loc theo bang pl_players nay.
   Doi pham vi du an sau nay -> chi can sua dung cho nay.
   ===================================================================== */

TRUNCATE TABLE pl_players;
GO

INSERT INTO pl_players (player_id)
SELECT DISTINCT
    TRY_CAST(TRY_CAST(NULLIF(TRIM(s.player_id), '') AS DECIMAL(20,3)) AS INT)
FROM stg_players s
WHERE TRIM(s.current_club_domestic_competition_id) = 'GB1'
  AND TRY_CAST(TRY_CAST(NULLIF(TRIM(s.player_id), '') AS DECIMAL(20,3)) AS INT) IS NOT NULL;
GO

SELECT COUNT(*) AS so_cau_thu_ngoai_hang FROM pl_players;
GO


/* =====================================================================
   BUOC 3 - COMPETITIONS VA CLUBS: NAP TOAN BO, KHONG LOC

   Hai bang nay nhe (vai nghin dong). Nap het de khong bao gio
   thieu CLB hay giai dau khi dung khoa ngoai o PHAN 4 file 01.
   CLB Bo Dao Nha, Duc, Phap... van xuat hien trong lich su
   chuyen nhuong cua cau thu Ngoai hang.

   Luu y ve TRY_CAST: chuoi rong '' khi ep sang INT se ra 0 chu khong
   phai NULL. Vi vay phai boc NULLIF(..., '') o ngoai truoc.
   ===================================================================== */

DELETE FROM competitions;
GO

INSERT INTO competitions
    (competition_id, competition_code, name, sub_type, competition_type,
     country_id, country_name, domestic_league_code, confederation, total_clubs, url)
SELECT
    TRIM(s.competition_id),
    NULLIF(TRIM(s.competition_code), ''),
    NULLIF(TRIM(s.name), ''),
    NULLIF(TRIM(s.sub_type), ''),
    NULLIF(TRIM(s.[type]), ''),
    TRY_CAST(TRY_CAST(NULLIF(TRIM(s.country_id), '')  AS DECIMAL(20,3)) AS INT),
    NULLIF(TRIM(s.country_name), ''),
    NULLIF(TRIM(s.domestic_league_code), ''),
    NULLIF(TRIM(s.confederation), ''),
    TRY_CAST(TRY_CAST(NULLIF(TRIM(s.total_clubs), '') AS DECIMAL(20,3)) AS INT),
    NULLIF(TRIM(s.url), '')
FROM stg_competitions s
WHERE NULLIF(TRIM(s.competition_id), '') IS NOT NULL;
GO

DELETE FROM clubs;
GO

INSERT INTO clubs
    (club_id, club_code, name, domestic_competition_id, squad_size, average_age,
     foreigners_number, foreigners_percentage, national_team_players,
     stadium_name, stadium_seats, net_transfer_record, coach_name, last_season, url)
SELECT
    TRY_CAST(TRY_CAST(NULLIF(TRIM(s.club_id), '') AS DECIMAL(20,3)) AS INT),
    NULLIF(TRIM(s.club_code), ''),
    NULLIF(TRIM(s.name), ''),
    /* CLB tro toi giai dau khong ton tai -> de NULL, tranh gay khoa ngoai */
    CASE WHEN EXISTS (SELECT 1 FROM competitions c
                      WHERE c.competition_id = TRIM(s.domestic_competition_id))
         THEN TRIM(s.domestic_competition_id) END,
    TRY_CAST(TRY_CAST(NULLIF(TRIM(s.squad_size), '')            AS DECIMAL(20,3)) AS INT),
    /* average_age va foreigners_percentage von la so thap phan -> giu nguyen,
       ep ve so nguyen la mat du lieu co chu dich (26.4 -> 26) */
    TRY_CAST(NULLIF(TRIM(s.average_age), '')            AS DECIMAL(5,2)),
    TRY_CAST(TRY_CAST(NULLIF(TRIM(s.foreigners_number), '')     AS DECIMAL(20,3)) AS INT),
    TRY_CAST(NULLIF(TRIM(s.foreigners_percentage), '')  AS DECIMAL(5,2)),
    TRY_CAST(TRY_CAST(NULLIF(TRIM(s.national_team_players), '') AS DECIMAL(20,3)) AS INT),
    NULLIF(TRIM(s.stadium_name), ''),
    TRY_CAST(TRY_CAST(NULLIF(TRIM(s.stadium_seats), '')         AS DECIMAL(20,3)) AS INT),
    NULLIF(TRIM(s.net_transfer_record), ''),
    NULLIF(TRIM(s.coach_name), ''),
    TRY_CAST(TRY_CAST(NULLIF(TRIM(s.last_season), '')           AS DECIMAL(20,3)) AS INT),
    NULLIF(TRIM(s.url), '')
FROM stg_clubs s
WHERE TRY_CAST(TRY_CAST(NULLIF(TRIM(s.club_id), '') AS DECIMAL(20,3)) AS INT) IS NOT NULL;
GO


/* =====================================================================
   BUOC 4 - PLAYERS: chi cau thu trong pl_players
   ===================================================================== */

DELETE FROM players;
GO

INSERT INTO players
    (player_id, first_name, last_name, name, player_code, date_of_birth,
     country_of_birth, city_of_birth, country_of_citizenship,
     [position], sub_position, foot, height_in_cm, contract_expiration_date,
     agent_name, current_club_id, current_club_name,
     current_club_domestic_competition_id, market_value_in_eur,
     highest_market_value_in_eur, last_season, image_url, url)
SELECT
    TRY_CAST(TRY_CAST(NULLIF(TRIM(s.player_id), '') AS DECIMAL(20,3)) AS INT),
    NULLIF(TRIM(s.first_name), ''),
    NULLIF(TRIM(s.last_name), ''),
    NULLIF(TRIM(s.name), ''),
    NULLIF(TRIM(s.player_code), ''),
    TRY_CAST(NULLIF(TRIM(s.date_of_birth), '') AS DATE),
    NULLIF(TRIM(s.country_of_birth), ''),
    NULLIF(TRIM(s.city_of_birth), ''),
    NULLIF(TRIM(s.country_of_citizenship), ''),
    NULLIF(TRIM(s.[position]), ''),
    NULLIF(TRIM(s.sub_position), ''),
    NULLIF(TRIM(s.foot), ''),
    TRY_CAST(TRY_CAST(NULLIF(TRIM(s.height_in_cm), '') AS DECIMAL(20,3)) AS INT),
    TRY_CAST(NULLIF(TRIM(s.contract_expiration_date), '') AS DATE),
    NULLIF(TRIM(s.agent_name), ''),
    /* current_club_id co the la -1 hoac tro toi CLB khong ton tai -> NULL */
    CASE WHEN EXISTS (SELECT 1 FROM clubs c
                      WHERE c.club_id = TRY_CAST(TRY_CAST(NULLIF(TRIM(s.current_club_id), '') AS DECIMAL(20,3)) AS INT))
         THEN TRY_CAST(TRY_CAST(NULLIF(TRIM(s.current_club_id), '') AS DECIMAL(20,3)) AS INT) END,
    NULLIF(TRIM(s.current_club_name), ''),
    NULLIF(TRIM(s.current_club_domestic_competition_id), ''),
    TRY_CAST(TRY_CAST(NULLIF(TRIM(s.market_value_in_eur), '')         AS DECIMAL(20,3)) AS BIGINT),
    TRY_CAST(TRY_CAST(NULLIF(TRIM(s.highest_market_value_in_eur), '') AS DECIMAL(20,3)) AS BIGINT),
    TRY_CAST(TRY_CAST(NULLIF(TRIM(s.last_season), '')                 AS DECIMAL(20,3)) AS INT),
    NULLIF(TRIM(s.image_url), ''),
    NULLIF(TRIM(s.url), '')
FROM stg_players s
WHERE TRY_CAST(TRY_CAST(NULLIF(TRIM(s.player_id), '') AS DECIMAL(20,3)) AS INT)
      IN (SELECT player_id FROM pl_players);
GO


/* =====================================================================
   BUOC 5 - LICH SU: LOC THEO player_id, KHONG LOC THEO GIAI

   Day la phan quan trong nhat cua ca file.
   KHONG co dieu kien 'GB1' o bat ky cau nao duoi day.
   ===================================================================== */

/* --- 5.1 player_valuations: nguon cho bieu do bien dong gia tri ------- */
DELETE FROM player_valuations;
GO

INSERT INTO player_valuations
    (player_id, valuation_date, market_value_in_eur,
     current_club_id, current_club_name, player_club_domestic_competition_id)
SELECT
    TRY_CAST(TRY_CAST(NULLIF(TRIM(s.player_id), '') AS DECIMAL(20,3)) AS INT),
    TRY_CAST(TRIM(s.[date]) AS DATE),
    TRY_CAST(TRY_CAST(NULLIF(TRIM(s.market_value_in_eur), '') AS DECIMAL(20,3)) AS BIGINT),
    TRY_CAST(TRY_CAST(NULLIF(TRIM(s.current_club_id), '')     AS DECIMAL(20,3)) AS INT),
    NULLIF(TRIM(s.current_club_name), ''),
    NULLIF(TRIM(s.player_club_domestic_competition_id), '')
FROM stg_player_valuations s
WHERE TRY_CAST(TRY_CAST(NULLIF(TRIM(s.player_id), '') AS DECIMAL(20,3)) AS INT)
      IN (SELECT player_id FROM pl_players)
  /* bo dong co ngay hong, vi cot valuation_date khai bao NOT NULL */
  AND TRY_CAST(TRIM(s.[date]) AS DATE) IS NOT NULL;
GO

/* --- 5.2 transfers ----------------------------------------------------
   transfer_fee va market_value_in_eur o file nay duoc ghi dang thap phan
   ('25000.000'). Day chinh la hai cot tung bi mat sach du lieu.
   ---------------------------------------------------------------------- */
DELETE FROM transfers;
GO

INSERT INTO transfers
    (player_id, transfer_date, transfer_season, from_club_id, to_club_id,
     from_club_name, to_club_name, transfer_fee, market_value_in_eur)
SELECT
    TRY_CAST(TRY_CAST(NULLIF(TRIM(s.player_id), '') AS DECIMAL(20,3)) AS INT),
    TRY_CAST(TRIM(s.transfer_date) AS DATE),
    NULLIF(TRIM(s.transfer_season), ''),
    TRY_CAST(TRY_CAST(NULLIF(TRIM(s.from_club_id), '')        AS DECIMAL(20,3)) AS INT),
    TRY_CAST(TRY_CAST(NULLIF(TRIM(s.to_club_id), '')          AS DECIMAL(20,3)) AS INT),
    NULLIF(TRIM(s.from_club_name), ''),
    NULLIF(TRIM(s.to_club_name), ''),
    TRY_CAST(TRY_CAST(NULLIF(TRIM(s.transfer_fee), '')        AS DECIMAL(20,3)) AS BIGINT),
    TRY_CAST(TRY_CAST(NULLIF(TRIM(s.market_value_in_eur), '') AS DECIMAL(20,3)) AS BIGINT)
FROM stg_transfers s
WHERE TRY_CAST(TRY_CAST(NULLIF(TRIM(s.player_id), '') AS DECIMAL(20,3)) AS INT)
      IN (SELECT player_id FROM pl_players)
  AND TRY_CAST(TRIM(s.transfer_date) AS DATE) IS NOT NULL;
GO

/* --- 5.3 appearances: nguon cho cong cu so sanh cau thu ---------------
   Bang nang nhat. Neu may chay cham hoac het dung luong, xoa hai dau
   gach ngang o dong AND ap chot ben duoi de chi lay tu nam 2018 tro lai.
   --------------------------------------------------------------------- */
DELETE FROM appearances;
GO

INSERT INTO appearances
    (appearance_id, game_id, player_id, player_club_id, player_current_club_id,
     appearance_date, competition_id, goals, assists, minutes_played,
     yellow_cards, red_cards)
SELECT
    TRIM(s.appearance_id),
    TRY_CAST(TRY_CAST(NULLIF(TRIM(s.game_id), '')                AS DECIMAL(20,3)) AS INT),
    TRY_CAST(TRY_CAST(NULLIF(TRIM(s.player_id), '')              AS DECIMAL(20,3)) AS INT),
    TRY_CAST(TRY_CAST(NULLIF(TRIM(s.player_club_id), '')         AS DECIMAL(20,3)) AS INT),
    TRY_CAST(TRY_CAST(NULLIF(TRIM(s.player_current_club_id), '') AS DECIMAL(20,3)) AS INT),
    TRY_CAST(NULLIF(TRIM(s.[date]), '') AS DATE),
    NULLIF(TRIM(s.competition_id), ''),
    TRY_CAST(TRY_CAST(NULLIF(TRIM(s.goals), '')          AS DECIMAL(20,3)) AS INT),
    TRY_CAST(TRY_CAST(NULLIF(TRIM(s.assists), '')        AS DECIMAL(20,3)) AS INT),
    TRY_CAST(TRY_CAST(NULLIF(TRIM(s.minutes_played), '') AS DECIMAL(20,3)) AS INT),
    TRY_CAST(TRY_CAST(NULLIF(TRIM(s.yellow_cards), '')   AS DECIMAL(20,3)) AS INT),
    TRY_CAST(TRY_CAST(NULLIF(TRIM(s.red_cards), '')      AS DECIMAL(20,3)) AS INT)
FROM stg_appearances s
WHERE TRY_CAST(TRY_CAST(NULLIF(TRIM(s.player_id), '') AS DECIMAL(20,3)) AS INT)
      IN (SELECT player_id FROM pl_players)
  AND NULLIF(TRIM(s.appearance_id), '') IS NOT NULL
  -- AND TRY_CAST(NULLIF(TRIM(s.[date]), '') AS DATE) >= '2018-01-01'
;
GO


/* =====================================================================
   BUOC 6 - KIEM TRA SO DONG
   ===================================================================== */

SELECT 'competitions'      AS bang, COUNT(*) AS so_dong FROM competitions
UNION ALL SELECT 'clubs',             COUNT(*) FROM clubs
UNION ALL SELECT 'pl_players',        COUNT(*) FROM pl_players
UNION ALL SELECT 'players',           COUNT(*) FROM players
UNION ALL SELECT 'player_valuations', COUNT(*) FROM player_valuations
UNION ALL SELECT 'transfers',         COUNT(*) FROM transfers
UNION ALL SELECT 'appearances',       COUNT(*) FROM appearances;
GO


/* =====================================================================
   BUOC 6.5 - KIEM TRA KHONG MAT DU LIEU KHI EP KIEU

   Dem so dong DAT dong nay: so dong co gia tri o NGUON (staging) phai
   bang so dong co gia tri o DICH (bang chinh).
   Lech nhau = ep kieu that bai am tham, phai dieu tra ngay.

   COUNT(*)   dem moi dong.
   COUNT(cot) chi dem dong co gia tri khac NULL.
   Chenh lech giua hai so nay chinh la cho du lieu bi mat.
   ===================================================================== */

SELECT 'players.market_value_in_eur' AS cot,
       (SELECT COUNT(*) FROM stg_players s
         WHERE NULLIF(TRIM(s.market_value_in_eur), '') IS NOT NULL
           AND TRY_CAST(TRY_CAST(NULLIF(TRIM(s.player_id), '') AS DECIMAL(20,3)) AS INT)
               IN (SELECT player_id FROM pl_players))          AS nguon,
       (SELECT COUNT(market_value_in_eur) FROM players)        AS dich

UNION ALL
SELECT 'player_valuations.market_value_in_eur',
       (SELECT COUNT(*) FROM stg_player_valuations s
         WHERE NULLIF(TRIM(s.market_value_in_eur), '') IS NOT NULL
           AND TRY_CAST(TRIM(s.[date]) AS DATE) IS NOT NULL
           AND TRY_CAST(TRY_CAST(NULLIF(TRIM(s.player_id), '') AS DECIMAL(20,3)) AS INT)
               IN (SELECT player_id FROM pl_players)),
       (SELECT COUNT(market_value_in_eur) FROM player_valuations)

UNION ALL
SELECT 'transfers.transfer_fee',
       (SELECT COUNT(*) FROM stg_transfers s
         WHERE NULLIF(TRIM(s.transfer_fee), '') IS NOT NULL
           AND TRY_CAST(TRIM(s.transfer_date) AS DATE) IS NOT NULL
           AND TRY_CAST(TRY_CAST(NULLIF(TRIM(s.player_id), '') AS DECIMAL(20,3)) AS INT)
               IN (SELECT player_id FROM pl_players)),
       (SELECT COUNT(transfer_fee) FROM transfers)

UNION ALL
SELECT 'appearances.minutes_played',
       (SELECT COUNT(*) FROM stg_appearances s
         WHERE NULLIF(TRIM(s.minutes_played), '') IS NOT NULL
           AND NULLIF(TRIM(s.appearance_id), '') IS NOT NULL
           AND TRY_CAST(TRY_CAST(NULLIF(TRIM(s.player_id), '') AS DECIMAL(20,3)) AS INT)
               IN (SELECT player_id FROM pl_players)),
       (SELECT COUNT(minutes_played) FROM appearances);
GO


/* =====================================================================
   BUOC 7 - KIEM TRA TOAN VEN VA XEM DU LIEU THAT
   ===================================================================== */

/* --- Kiem tra khoa ngoai truoc khi chay PHAN 4 file 01 ---------------
   Ca 3 cau duoi PHAI tra ve 0 dong. Co dong nao la PHAN 4 se bao loi.
   --------------------------------------------------------------------- */
SELECT COUNT(*) AS loi_clubs_thieu_giai
FROM clubs c
WHERE c.domestic_competition_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM competitions x WHERE x.competition_id = c.domestic_competition_id);

SELECT COUNT(*) AS loi_players_thieu_clb
FROM players p
WHERE p.current_club_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM clubs x WHERE x.club_id = p.current_club_id);

SELECT COUNT(*) AS loi_lich_su_thieu_cau_thu
FROM (
    SELECT player_id FROM player_valuations
    UNION SELECT player_id FROM transfers
    UNION SELECT player_id FROM appearances
) t
WHERE NOT EXISTS (SELECT 1 FROM players x WHERE x.player_id = t.player_id);
GO

/* --- Xem thu du lieu that ------------------------------------------- */

-- 10 cau thu dat gia nhat
SELECT TOP 10 name, [position], current_club_name, market_value_in_eur
FROM players
ORDER BY market_value_in_eur DESC;

-- Lich su gia tri cua mot cau thu bat ky (nguon cho bieu do duong)
SELECT TOP 30 p.name, v.valuation_date, v.market_value_in_eur, v.current_club_name
FROM player_valuations v
JOIN players p ON p.player_id = v.player_id
WHERE p.player_id = (SELECT TOP 1 player_id FROM players ORDER BY market_value_in_eur DESC)
ORDER BY v.valuation_date;

-- 10 vu chuyen nhuong dat nhat (kiem chung cot transfer_fee)
SELECT TOP 10 transfer_date, from_club_name, to_club_name, transfer_fee
FROM transfers
WHERE transfer_fee > 0
ORDER BY transfer_fee DESC;
GO


/* =====================================================================
   BUOC 8 - SAU KHI MOI THU DA DUNG

   1. Quay lai file 01_tao_bang.sql, chay PHAN 4 (khoa ngoai + chi muc).
   2. Chi khi da chay xong PHAN 4 va kiem tra on, moi xoa bang staging:

      DROP TABLE stg_competitions, stg_clubs, stg_players,
                 stg_player_valuations, stg_transfers, stg_appearances;

      Giu lai cung duoc - chi ton dung luong. Xoa roi ma can import
      lai thi phai chay lai PHAN 2 cua file 01.
   ===================================================================== */


/* =====================================================================
   PHU LUC - GO KHOA NGOAI DE IMPORT LAI

   CHI boi den va chay khoi duoi khi can import lai tu dau tren mot
   database DA co khoa ngoai. Khong phai buoc binh thuong cua file nay.
   Go xong thi quay lai BUOC 1, va import xong phai chay lai PHAN 4
   cua file 01 de tao lai khoa ngoai.

   ALTER TABLE appearances        DROP CONSTRAINT FK_ap_player;
   ALTER TABLE transfers          DROP CONSTRAINT FK_tr_player;
   ALTER TABLE player_valuations  DROP CONSTRAINT FK_pv_player;
   ALTER TABLE pl_players         DROP CONSTRAINT FK_plplayers_player;
   ALTER TABLE players            DROP CONSTRAINT FK_players_club;
   ALTER TABLE clubs              DROP CONSTRAINT FK_clubs_competition;
   ===================================================================== */