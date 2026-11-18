-- Run manually against the intended SmartClinic database after backup.
-- Existing rows remain NULL. This script does not change patient identity or keys.
SET XACT_ABORT ON;
BEGIN TRANSACTION;
IF OBJECT_ID(N'dbo.PatientProfiles', N'U') IS NULL
    THROW 50001, 'Expected dbo.PatientProfiles table was not found. Check database/schema.', 1;
IF COL_LENGTH(N'dbo.PatientProfiles', N'HeightCm') IS NULL
    ALTER TABLE dbo.PatientProfiles ADD HeightCm decimal(6,2) NULL;
IF COL_LENGTH(N'dbo.PatientProfiles', N'WeightKg') IS NULL
    ALTER TABLE dbo.PatientProfiles ADD WeightKg decimal(6,2) NULL;
COMMIT TRANSACTION;
-- Rollback, only after checking that no measurements need to be retained:
-- ALTER TABLE dbo.PatientProfiles DROP COLUMN HeightCm, WeightKg;
