USE master;
GO
CREATE LOGIN qlda_app WITH PASSWORD = 'Luxxie29@', CHECK_POLICY = ON;
GO

USE QLDA_CauThu;
GO
CREATE USER qlda_app FOR LOGIN qlda_app;
ALTER ROLE db_owner ADD MEMBER qlda_app;
GO

SELECT COUNT(*) AS so_cau_thu FROM QLDA_CauThu.dbo.players;