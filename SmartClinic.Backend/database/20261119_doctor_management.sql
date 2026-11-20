SET XACT_ABORT ON;
BEGIN TRANSACTION;
IF COL_LENGTH('dbo.DoctorProfiles','PrimaryDepartmentId') IS NULL
BEGIN
 ALTER TABLE dbo.DoctorProfiles ADD PrimaryDepartmentId int NULL, Title nvarchar(150) NULL,
 Position nvarchar(255) NULL, Expertise nvarchar(max) NULL, Education nvarchar(max) NULL,
 WorkHistory nvarchar(max) NULL, Certificates nvarchar(max) NULL,
 IsPublished bit NOT NULL CONSTRAINT DF_DoctorPublished DEFAULT 0,
 IsFeatured bit NOT NULL CONSTRAINT DF_DoctorFeatured DEFAULT 0,
 AcceptingBookings bit NOT NULL CONSTRAINT DF_DoctorBookings DEFAULT 0,
 SortOrder int NOT NULL CONSTRAINT DF_DoctorSort DEFAULT 0,
 Photo varbinary(max) NULL, PhotoContentType nvarchar(50) NULL;
 ALTER TABLE dbo.DoctorProfiles ADD CONSTRAINT FK_DoctorPrimaryDepartment FOREIGN KEY (PrimaryDepartmentId) REFERENCES dbo.Departments(Id);
END;
IF OBJECT_ID('dbo.DoctorSchedules') IS NULL
BEGIN
 CREATE TABLE dbo.DoctorSchedules (
 Id uniqueidentifier NOT NULL PRIMARY KEY,
 DoctorId uniqueidentifier NOT NULL REFERENCES dbo.DoctorProfiles(UserId),
 StartTime datetime2 NOT NULL, EndTime datetime2 NOT NULL,
 SlotMinutes int NOT NULL, Room nvarchar(100) NOT NULL, IsActive bit NOT NULL DEFAULT 1,
 CONSTRAINT CK_DoctorScheduleRange CHECK (EndTime > StartTime AND SlotMinutes BETWEEN 5 AND 120));
 CREATE INDEX IX_DoctorSchedules_Doctor ON dbo.DoctorSchedules(DoctorId,StartTime,EndTime);
END;
IF COL_LENGTH('dbo.TimeSlots','ScheduleId') IS NULL
 ALTER TABLE dbo.TimeSlots ADD ScheduleId uniqueidentifier NULL REFERENCES dbo.DoctorSchedules(Id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='IX_TimeSlots_DoctorTime' AND object_id=OBJECT_ID('dbo.TimeSlots'))
 CREATE INDEX IX_TimeSlots_DoctorTime ON dbo.TimeSlots(DoctorId,StartTime,EndTime);
COMMIT;
GO
-- Preserve existing clinical assignments; copy their primary department into the new single primary field.
UPDATE p SET PrimaryDepartmentId = d.DepartmentId
FROM dbo.DoctorProfiles p CROSS APPLY (
 SELECT TOP (1) DepartmentId FROM dbo.DoctorDepartments d
 WHERE d.DoctorId=p.UserId AND d.IsActive=1 AND d.IsPrimary=1 ORDER BY AssignedAtUtc DESC,DepartmentId
) d WHERE p.PrimaryDepartmentId IS NULL;
