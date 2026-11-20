-- Run before deploying the specialty management API. Safe to run repeatedly.
IF COL_LENGTH('dbo.Specialties', 'IsActive') IS NULL
    ALTER TABLE dbo.Specialties ADD IsActive bit NOT NULL
        CONSTRAINT DF_Specialties_IsActive DEFAULT (1) WITH VALUES;
GO
