/* =====================================================================
   QLDA - HE THONG THEO DOI GIA TRI CHUYEN NHUONG CAU THU
   File 01: Tao database, bang staging va bang chinh
   ===================================================================== */
 
/* =====================================================================
   P1 - TAO DATABASE
   ===================================================================== */
USE master;
GO
 
IF DB_ID('QLDA_CauThu') IS NULL
    CREATE DATABASE QLDA_CauThu;
GO
 
USE QLDA_CauThu;
GO
 
 
/* =====================================================================
   PHAN 2 - BANG TRUNG GIAN
 
   Moi cot deu de NVARCHAR. Co y lam vay:
   BULK INSERT nap du lieu tho, khong ep kieu -> khong bao gio bao loi
   giua chung. Viec ep kieu va bat loi de sang buoc INSERT ... SELECT
   o file 02, luc do kiem soat duoc tung dong hong.
 
   THU TU COT PHAI TRUNG DUNG voi thu tu cot trong file CSV.
   ===================================================================== */
 
DROP TABLE IF EXISTS stg_competitions;
CREATE TABLE stg_competitions (
    competition_id        NVARCHAR(100),
    competition_code      NVARCHAR(200),
    name                  NVARCHAR(300),
    sub_type              NVARCHAR(100),
    [type]                NVARCHAR(100),
    country_id            NVARCHAR(50),
    country_name          NVARCHAR(200),
    domestic_league_code  NVARCHAR(100),
    confederation         NVARCHAR(100),
    total_clubs           NVARCHAR(50),
    url                   NVARCHAR(1000)
);
GO
 
DROP TABLE IF EXISTS stg_clubs;
CREATE TABLE stg_clubs (
    club_id                  NVARCHAR(50),
    club_code                NVARCHAR(300),
    name                     NVARCHAR(300),
    domestic_competition_id  NVARCHAR(100),
    total_market_value       NVARCHAR(100),
    squad_size               NVARCHAR(50),
    average_age              NVARCHAR(50),
    foreigners_number        NVARCHAR(50),
    foreigners_percentage    NVARCHAR(50),
    national_team_players    NVARCHAR(50),
    stadium_name             NVARCHAR(300),
    stadium_seats            NVARCHAR(50),
    net_transfer_record      NVARCHAR(100),
    coach_name               NVARCHAR(300),
    last_season              NVARCHAR(50),
    [filename]               NVARCHAR(500),
    url                      NVARCHAR(1000)
);
GO
 
DROP TABLE IF EXISTS stg_players;
CREATE TABLE stg_players (
    player_id                            NVARCHAR(50),
    first_name                           NVARCHAR(200),
    last_name                            NVARCHAR(200),
    name                                 NVARCHAR(300),
    last_season                          NVARCHAR(50),
    current_club_id                      NVARCHAR(50),
    player_code                          NVARCHAR(300),
    country_of_birth                     NVARCHAR(200),
    city_of_birth                        NVARCHAR(200),
    country_of_citizenship               NVARCHAR(200),
    date_of_birth                        NVARCHAR(100),
    sub_position                         NVARCHAR(100),
    [position]                           NVARCHAR(100),
    foot                                 NVARCHAR(50),
    height_in_cm                         NVARCHAR(50),
    contract_expiration_date             NVARCHAR(100),
    agent_name                           NVARCHAR(300),
    image_url                            NVARCHAR(1000),
    international_caps                   NVARCHAR(50),
    international_goals                  NVARCHAR(50),
    current_national_team_id             NVARCHAR(50),
    url                                  NVARCHAR(1000),
    current_club_domestic_competition_id NVARCHAR(100),
    current_club_name                    NVARCHAR(300),
    market_value_in_eur                  NVARCHAR(100),
    highest_market_value_in_eur          NVARCHAR(100)
);
GO
 
DROP TABLE IF EXISTS stg_player_valuations;
CREATE TABLE stg_player_valuations (
    player_id                            NVARCHAR(50),
    [date]                               NVARCHAR(100),
    market_value_in_eur                  NVARCHAR(100),
    current_club_name                    NVARCHAR(300),
    current_club_id                      NVARCHAR(50),
    player_club_domestic_competition_id  NVARCHAR(100)
);
GO
 
DROP TABLE IF EXISTS stg_transfers;
CREATE TABLE stg_transfers (
    player_id            NVARCHAR(50),
    transfer_date        NVARCHAR(100),
    transfer_season      NVARCHAR(50),
    from_club_id         NVARCHAR(50),
    to_club_id           NVARCHAR(50),
    from_club_name       NVARCHAR(300),
    to_club_name         NVARCHAR(300),
    transfer_fee         NVARCHAR(100),
    market_value_in_eur  NVARCHAR(100),
    player_name          NVARCHAR(300)
);
GO
 
DROP TABLE IF EXISTS stg_appearances;
CREATE TABLE stg_appearances (
    appearance_id           NVARCHAR(100),
    game_id                 NVARCHAR(50),
    player_id               NVARCHAR(50),
    player_club_id          NVARCHAR(50),
    player_current_club_id  NVARCHAR(50),
    [date]                  NVARCHAR(100),
    player_name             NVARCHAR(300),
    competition_id          NVARCHAR(100),
    yellow_cards            NVARCHAR(50),
    red_cards               NVARCHAR(50),
    goals                   NVARCHAR(50),
    assists                 NVARCHAR(50),
    minutes_played          NVARCHAR(50)
);
GO
 
 
/* =====================================================================
   PHAN 3 - BANG CHINH
 
   Luu y ve thu tu tao bang: competitions -> clubs -> players -> con lai.
   Khoa ngoai chi them o PHAN 4, sau khi da co du lieu.
   ===================================================================== */
 
DROP TABLE IF EXISTS appearances;
DROP TABLE IF EXISTS transfers;
DROP TABLE IF EXISTS player_valuations;
DROP TABLE IF EXISTS pl_players;
DROP TABLE IF EXISTS players;
DROP TABLE IF EXISTS clubs;
DROP TABLE IF EXISTS competitions;
DROP TABLE IF EXISTS users;
GO
 
/* --- competitions: nap TOAN BO, khong loc ----------------------------- */
CREATE TABLE competitions (
    competition_id        NVARCHAR(20)  NOT NULL,
    competition_code      NVARCHAR(100) NULL,
    name                  NVARCHAR(200) NULL,
    sub_type              NVARCHAR(50)  NULL,
    competition_type      NVARCHAR(50)  NULL,
    country_id            INT           NULL,
    country_name          NVARCHAR(100) NULL,
    domestic_league_code  NVARCHAR(20)  NULL,
    confederation         NVARCHAR(50)  NULL,
    total_clubs           INT           NULL,
    url                   NVARCHAR(500) NULL,
    CONSTRAINT PK_competitions PRIMARY KEY (competition_id)
);
GO
 
/* --- clubs: nap TOAN BO, khong loc ------------------------------------
   Bat buoc nap het. CLB ngoai Anh van xuat hien trong lich su
   chuyen nhuong cua cau thu Ngoai hang -> thieu la gay khoa ngoai.
   --------------------------------------------------------------------- */
CREATE TABLE clubs (
    club_id                  INT           NOT NULL,
    club_code                NVARCHAR(200) NULL,
    name                     NVARCHAR(200) NULL,
    domestic_competition_id  NVARCHAR(20)  NULL,
    squad_size               INT           NULL,
    average_age              DECIMAL(5,2)  NULL,
    foreigners_number        INT           NULL,
    foreigners_percentage    DECIMAL(5,2)  NULL,
    national_team_players    INT           NULL,
    stadium_name             NVARCHAR(200) NULL,
    stadium_seats            INT           NULL,
    net_transfer_record      NVARCHAR(50)  NULL,
    coach_name               NVARCHAR(200) NULL,
    last_season              INT           NULL,
    url                      NVARCHAR(500) NULL,
    CONSTRAINT PK_clubs PRIMARY KEY (club_id)
);
GO
 
/* --- players ---------------------------------------------------------
   Cot "name" dung collation Latin1_General_CI_AI:
     CI = khong phan biet hoa thuong
     AI = KHONG PHAN BIET DAU
   Nho vay go "Ozil" van tim ra "Ozil" co dau, "Hakan" ra "Hakan".
   Phuc vu truc tiep chuc nang CN04 - Tim kiem.
   --------------------------------------------------------------------- */
CREATE TABLE players (
    player_id                            INT NOT NULL,
    first_name                           NVARCHAR(100) NULL,
    last_name                            NVARCHAR(100) NULL,
    name                                 NVARCHAR(200) COLLATE Latin1_General_CI_AI NULL,
    player_code                          NVARCHAR(200) NULL,
    date_of_birth                        DATE NULL,
    country_of_birth                     NVARCHAR(100) NULL,
    city_of_birth                        NVARCHAR(100) NULL,
    country_of_citizenship               NVARCHAR(100) NULL,
    [position]                           NVARCHAR(50)  NULL,
    sub_position                         NVARCHAR(50)  NULL,
    foot                                 NVARCHAR(20)  NULL,
    height_in_cm                         INT NULL,
    contract_expiration_date             DATE NULL,
    agent_name                           NVARCHAR(200) NULL,
    current_club_id                      INT NULL,
    current_club_name                    NVARCHAR(200) NULL,
    current_club_domestic_competition_id NVARCHAR(20)  NULL,
    market_value_in_eur                  BIGINT NULL,
    highest_market_value_in_eur          BIGINT NULL,
    last_season                          INT NULL,
    image_url                            NVARCHAR(500) NULL,
    url                                  NVARCHAR(500) NULL,
    CONSTRAINT PK_players PRIMARY KEY (player_id)
);
GO
 
/* --- pl_players: bang phu chot danh sach cau thu Ngoai hang Anh -------
   File 02 se do danh sach player_id vao day, roi moi bang khac
   loc theo bang nay. Tach rieng de sau nay doi pham vi chi can
   sua mot cho.
   --------------------------------------------------------------------- */
CREATE TABLE pl_players (
    player_id INT NOT NULL,
    CONSTRAINT PK_pl_players PRIMARY KEY (player_id)
);
GO
 
/* --- player_valuations -----------------------------------------------
   Khoa chinh la cot IDENTITY chu khong phai (player_id, date):
   du lieu tho co the co dong trung, dat khoa ghep se bi chan khi import.
   Chi muc phan cum (clustered) dat tren (player_id, valuation_date)
   vi bieu do bien dong gia tri luon truy van theo dung thu tu nay.
   --------------------------------------------------------------------- */
CREATE TABLE player_valuations (
    valuation_id                        INT IDENTITY(1,1) NOT NULL,
    player_id                           INT  NOT NULL,
    valuation_date                      DATE NOT NULL,
    market_value_in_eur                 BIGINT NULL,
    current_club_id                     INT NULL,
    current_club_name                   NVARCHAR(200) NULL,
    player_club_domestic_competition_id NVARCHAR(20) NULL,
    CONSTRAINT PK_player_valuations PRIMARY KEY NONCLUSTERED (valuation_id)
);
GO
 
/* --- transfers -------------------------------------------------------- */
CREATE TABLE transfers (
    transfer_id          INT IDENTITY(1,1) NOT NULL,
    player_id            INT  NOT NULL,
    transfer_date        DATE NOT NULL,
    transfer_season      NVARCHAR(20) NULL,
    from_club_id         INT NULL,
    to_club_id           INT NULL,
    from_club_name       NVARCHAR(200) NULL,
    to_club_name         NVARCHAR(200) NULL,
    transfer_fee         BIGINT NULL,
    market_value_in_eur  BIGINT NULL,
    CONSTRAINT PK_transfers PRIMARY KEY NONCLUSTERED (transfer_id)
);
GO
 
/* --- appearances ------------------------------------------------------
   Phuc vu CN07 - So sanh cau thu:
   SUM(goals), SUM(assists), SUM(minutes_played) theo player_id.
   --------------------------------------------------------------------- */
CREATE TABLE appearances (
    appearance_id           NVARCHAR(50) NOT NULL,
    game_id                 INT NULL,
    player_id               INT NOT NULL,
    player_club_id          INT NULL,
    player_current_club_id  INT NULL,
    appearance_date         DATE NULL,
    competition_id          NVARCHAR(20) NULL,
    goals                   INT NULL,
    assists                 INT NULL,
    minutes_played          INT NULL,
    yellow_cards            INT NULL,
    red_cards               INT NULL,
    CONSTRAINT PK_appearances PRIMARY KEY NONCLUSTERED (appearance_id)
);
GO
 
/* --- users: phuc vu CN01, CN02, CN03 ---------------------------------
   Bang nay KHONG co trong dataset, tu tao cho chuc nang dang nhap.
   Chi luu ma bam (hash) cua mat khau, khong bao gio luu mat khau tho.
   --------------------------------------------------------------------- */
CREATE TABLE users (
    user_id        INT IDENTITY(1,1) NOT NULL,
    email          NVARCHAR(200) NOT NULL,
    password_hash  NVARCHAR(255) NOT NULL,
    full_name      NVARCHAR(200) NULL,
    role           NVARCHAR(20)  NOT NULL CONSTRAINT DF_users_role DEFAULT 'user',
    created_at     DATETIME2     NOT NULL CONSTRAINT DF_users_created DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_users PRIMARY KEY (user_id),
    CONSTRAINT UQ_users_email UNIQUE (email),
    CONSTRAINT CK_users_role CHECK (role IN ('user', 'admin'))
);
GO

/* =====================================================================
   PHAN 4 - KHOA NGOAI VA CHI MUC
 
   !!! DUNG LAI O DAY !!!
   Chi chay PHAN 4 SAU KHI da import xong du lieu (file 02).
 
   Ly do: them khoa ngoai va chi muc truoc khi nap du lieu se lam
   BULK INSERT cham hon nhieu lan, vi SQL Server phai kiem tra
   rang buoc va cap nhat chi muc tren tung dong.
   ===================================================================== */
 
/* --- Chi muc phan cum: quyet dinh du lieu nam vat ly theo thu tu nao -- */
 
CREATE CLUSTERED INDEX IX_pv_player_date
    ON player_valuations (player_id, valuation_date);
GO
 
CREATE CLUSTERED INDEX IX_tr_player_date
    ON transfers (player_id, transfer_date);
GO
 
CREATE CLUSTERED INDEX IX_ap_player_date
    ON appearances (player_id, appearance_date);
GO
 
/* --- Chi muc cho chuc nang tim kiem va loc ---------------------------- */
 
-- CN04 Tim kiem theo ten
CREATE NONCLUSTERED INDEX IX_players_name
    ON players (name);
GO
 
-- CN05 Loc theo vi tri, quoc tich, ngay sinh (suy ra do tuoi)
CREATE NONCLUSTERED INDEX IX_players_position
    ON players ([position])
    INCLUDE (name, current_club_name, market_value_in_eur);
GO
 
CREATE NONCLUSTERED INDEX IX_players_citizenship
    ON players (country_of_citizenship)
    INCLUDE (name, current_club_name, market_value_in_eur);
GO
 
CREATE NONCLUSTERED INDEX IX_players_dob
    ON players (date_of_birth);
GO
 
-- CN07 Xep hang cau thu dat gia nhat: sap giam dan
CREATE NONCLUSTERED INDEX IX_players_value
    ON players (market_value_in_eur DESC)
    INCLUDE (name, [position], current_club_name, country_of_citizenship);
GO
 
-- Loc theo CLB va theo giai dau
CREATE NONCLUSTERED INDEX IX_players_club
    ON players (current_club_id);
GO
 
CREATE NONCLUSTERED INDEX IX_players_league
    ON players (current_club_domestic_competition_id);
GO
 
CREATE NONCLUSTERED INDEX IX_clubs_league
    ON clubs (domestic_competition_id);
GO
 
CREATE NONCLUSTERED INDEX IX_ap_competition
    ON appearances (competition_id, player_id);
GO
 
 
/* --- Khoa ngoai -------------------------------------------------------
   Dat khoa ngoai SAU CUNG. Neu buoc nay bao loi, nghia la import
   thieu CLB hoac giai dau nao do -> quay lai file 02 nap bo sung.
   --------------------------------------------------------------------- */
 
ALTER TABLE clubs ADD CONSTRAINT FK_clubs_competition
    FOREIGN KEY (domestic_competition_id) REFERENCES competitions (competition_id);
GO
 
ALTER TABLE players ADD CONSTRAINT FK_players_club
    FOREIGN KEY (current_club_id) REFERENCES clubs (club_id);
GO
 
ALTER TABLE pl_players ADD CONSTRAINT FK_plplayers_player
    FOREIGN KEY (player_id) REFERENCES players (player_id);
GO
 
ALTER TABLE player_valuations ADD CONSTRAINT FK_pv_player
    FOREIGN KEY (player_id) REFERENCES players (player_id);
GO
 
ALTER TABLE transfers ADD CONSTRAINT FK_tr_player
    FOREIGN KEY (player_id) REFERENCES players (player_id);
GO
 
ALTER TABLE appearances ADD CONSTRAINT FK_ap_player
    FOREIGN KEY (player_id) REFERENCES players (player_id);
GO

/* =====================================================================
   KIEM TRA SAU CUNG
   ===================================================================== */
 
SELECT
    t.name                                   AS ten_bang,
    SUM(CASE WHEN p.index_id IN (0,1)
             THEN p.[rows] ELSE 0 END)       AS so_dong
FROM sys.tables t
JOIN sys.partitions p ON t.object_id = p.object_id
WHERE t.name NOT LIKE 'stg_%'
GROUP BY t.name
ORDER BY t.name;
GO