IF COL_LENGTH('dbo.Specialties', 'WorkspaceType') IS NULL
    ALTER TABLE dbo.Specialties ADD WorkspaceType nvarchar(30) NULL;
GO
UPDATE dbo.Specialties SET WorkspaceType = N'Consultation' WHERE Name = N'Tim mạch';
UPDATE dbo.Specialties SET WorkspaceType = N'ClinicalService' WHERE Name = N'Chẩn đoán hình ảnh';
