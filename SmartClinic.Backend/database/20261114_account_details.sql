-- Apply after 20261109_admin_basics.sql.
SET XACT_ABORT ON;
BEGIN TRANSACTION;
IF COL_LENGTH('dbo.Users', 'FullName') IS NULL
    ALTER TABLE dbo.Users ADD FullName nvarchar(100) NULL;
IF COL_LENGTH('dbo.Users', 'Department') IS NULL
    ALTER TABLE dbo.Users ADD Department nvarchar(150) NULL;
IF COL_LENGTH('dbo.Users', 'IdentityNumber') IS NULL
    ALTER TABLE dbo.Users ADD IdentityNumber nvarchar(12) NULL;
IF COL_LENGTH('dbo.Users', 'DeletedAtUtc') IS NULL
    ALTER TABLE dbo.Users ADD DeletedAtUtc datetime2 NULL;
COMMIT TRANSACTION;
