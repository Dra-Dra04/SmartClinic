/*
    SmartClinic - Clinical workflow extension
    Target: SQL Server / database SmartClinic

    This script is additive and idempotent:
    - It does not drop or alter existing tables.
    - Existing tables expected by the current model:
        Users(Id), PatientProfiles(UserId), Appointments(Id),
        DoctorProfiles(UserId), Specialties(Id)
    - Run stages in order. Each stage is safe to run again.
*/

USE [SmartClinic];
GO

/* ================================================================
   STAGE 1 - Departments and clinical service catalog
   ================================================================ */
IF OBJECT_ID(N'dbo.Departments', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Departments
    (
        Id              INT IDENTITY(1,1) NOT NULL
            CONSTRAINT PK_Departments PRIMARY KEY,
        Code            VARCHAR(50) NOT NULL,
        Name            NVARCHAR(200) NOT NULL,
        IsActive        BIT NOT NULL
            CONSTRAINT DF_Departments_IsActive DEFAULT (1),
        CreatedAtUtc    DATETIME2(0) NOT NULL
            CONSTRAINT DF_Departments_CreatedAtUtc DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT UQ_Departments_Code UNIQUE (Code)
    );
END;
GO

IF OBJECT_ID(N'dbo.ClinicalServices', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ClinicalServices
    (
        Id              INT IDENTITY(1,1) NOT NULL
            CONSTRAINT PK_ClinicalServices PRIMARY KEY,
        DepartmentId    INT NOT NULL,
        Code            VARCHAR(50) NOT NULL,
        Name            NVARCHAR(300) NOT NULL,
        ServiceType     VARCHAR(30) NOT NULL,
        Price           DECIMAL(18,2) NULL,
        RequiresPayment BIT NOT NULL
            CONSTRAINT DF_ClinicalServices_RequiresPayment DEFAULT (0),
        IsActive        BIT NOT NULL
            CONSTRAINT DF_ClinicalServices_IsActive DEFAULT (1),
        ResultSchema    NVARCHAR(MAX) NULL,
        CreatedAtUtc    DATETIME2(0) NOT NULL
            CONSTRAINT DF_ClinicalServices_CreatedAtUtc DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT UQ_ClinicalServices_Code UNIQUE (Code),
        CONSTRAINT CK_ClinicalServices_ServiceType CHECK
            (ServiceType IN ('Laboratory','Ultrasound','Endoscopy','Imaging','Pathology','Consultation')),
        CONSTRAINT FK_ClinicalServices_Department
            FOREIGN KEY (DepartmentId) REFERENCES dbo.Departments(Id)
    );
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = N'IX_ClinicalServices_Department_Active'
                 AND object_id = OBJECT_ID(N'dbo.ClinicalServices'))
    CREATE INDEX IX_ClinicalServices_Department_Active
        ON dbo.ClinicalServices(DepartmentId, IsActive);
GO

/* ================================================================
   STAGE 2 - Doctor-to-department assignment
   A doctor may work with more than one department.
   ================================================================ */
IF OBJECT_ID(N'dbo.DoctorDepartments', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.DoctorDepartments
    (
        DoctorId        UNIQUEIDENTIFIER NOT NULL,
        DepartmentId    INT NOT NULL,
        IsPrimary       BIT NOT NULL
            CONSTRAINT DF_DoctorDepartments_IsPrimary DEFAULT (0),
        IsActive        BIT NOT NULL
            CONSTRAINT DF_DoctorDepartments_IsActive DEFAULT (1),
        AssignedAtUtc   DATETIME2(0) NOT NULL
            CONSTRAINT DF_DoctorDepartments_AssignedAtUtc DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT PK_DoctorDepartments PRIMARY KEY (DoctorId, DepartmentId),
        CONSTRAINT FK_DoctorDepartments_Doctor
            FOREIGN KEY (DoctorId) REFERENCES dbo.DoctorProfiles(UserId),
        CONSTRAINT FK_DoctorDepartments_Department
            FOREIGN KEY (DepartmentId) REFERENCES dbo.Departments(Id)
    );
END;
GO

/* ================================================================
   STAGE 3 - Orders and individual ordered services
   ================================================================ */
IF OBJECT_ID(N'dbo.ClinicalOrders', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ClinicalOrders
    (
        Id                  UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT PK_ClinicalOrders PRIMARY KEY
            DEFAULT (NEWSEQUENTIALID()),
        AppointmentId       UNIQUEIDENTIFIER NOT NULL,
        PatientId           UNIQUEIDENTIFIER NOT NULL,
        OrderedByDoctorId   UNIQUEIDENTIFIER NOT NULL,
        Status              VARCHAR(20) NOT NULL
            CONSTRAINT DF_ClinicalOrders_Status DEFAULT ('Ordered'),
        Priority            VARCHAR(20) NOT NULL
            CONSTRAINT DF_ClinicalOrders_Priority DEFAULT ('Routine'),
        ClinicalNote        NVARCHAR(2000) NULL,
        OrderedAtUtc        DATETIME2(0) NOT NULL
            CONSTRAINT DF_ClinicalOrders_OrderedAtUtc DEFAULT (SYSUTCDATETIME()),
        CompletedAtUtc      DATETIME2(0) NULL,
        CancelledAtUtc      DATETIME2(0) NULL,
        CONSTRAINT CK_ClinicalOrders_Status CHECK
            (Status IN ('Draft','Ordered','Paid','Processing','Completed','Cancelled')),
        CONSTRAINT CK_ClinicalOrders_Priority CHECK
            (Priority IN ('Routine','Urgent','Stat')),
        CONSTRAINT FK_ClinicalOrders_Appointment
            FOREIGN KEY (AppointmentId) REFERENCES dbo.Appointments(Id),
        CONSTRAINT FK_ClinicalOrders_Patient
            FOREIGN KEY (PatientId) REFERENCES dbo.PatientProfiles(UserId),
        CONSTRAINT FK_ClinicalOrders_Doctor
            FOREIGN KEY (OrderedByDoctorId) REFERENCES dbo.DoctorProfiles(UserId)
    );
END;
GO

IF OBJECT_ID(N'dbo.ClinicalOrderItems', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ClinicalOrderItems
    (
        Id                  UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT PK_ClinicalOrderItems PRIMARY KEY
            DEFAULT (NEWSEQUENTIALID()),
        ClinicalOrderId     UNIQUEIDENTIFIER NOT NULL,
        ClinicalServiceId   INT NOT NULL,
        DepartmentId        INT NOT NULL,
        Status              VARCHAR(20) NOT NULL
            CONSTRAINT DF_ClinicalOrderItems_Status DEFAULT ('Ordered'),
        Priority            VARCHAR(20) NOT NULL
            CONSTRAINT DF_ClinicalOrderItems_Priority DEFAULT ('Routine'),
        Price               DECIMAL(18,2) NULL,
        Instructions        NVARCHAR(2000) NULL,
        ScheduledAtUtc      DATETIME2(0) NULL,
        StartedAtUtc        DATETIME2(0) NULL,
        CompletedAtUtc      DATETIME2(0) NULL,
        CONSTRAINT CK_ClinicalOrderItems_Status CHECK
            (Status IN ('Ordered','Paid','Waiting','InProgress','Completed','Cancelled')),
        CONSTRAINT CK_ClinicalOrderItems_Priority CHECK
            (Priority IN ('Routine','Urgent','Stat')),
        CONSTRAINT FK_ClinicalOrderItems_Order
            FOREIGN KEY (ClinicalOrderId) REFERENCES dbo.ClinicalOrders(Id),
        CONSTRAINT FK_ClinicalOrderItems_Service
            FOREIGN KEY (ClinicalServiceId) REFERENCES dbo.ClinicalServices(Id),
        CONSTRAINT FK_ClinicalOrderItems_Department
            FOREIGN KEY (DepartmentId) REFERENCES dbo.Departments(Id)
    );
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = N'IX_ClinicalOrders_Patient_Status'
                 AND object_id = OBJECT_ID(N'dbo.ClinicalOrders'))
    CREATE INDEX IX_ClinicalOrders_Patient_Status
        ON dbo.ClinicalOrders(PatientId, Status, OrderedAtUtc DESC);

IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = N'IX_ClinicalOrders_Appointment'
                 AND object_id = OBJECT_ID(N'dbo.ClinicalOrders'))
    CREATE INDEX IX_ClinicalOrders_Appointment
        ON dbo.ClinicalOrders(AppointmentId, OrderedAtUtc DESC);

IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = N'IX_ClinicalOrderItems_Department_Status'
                 AND object_id = OBJECT_ID(N'dbo.ClinicalOrderItems'))
    CREATE INDEX IX_ClinicalOrderItems_Department_Status
        ON dbo.ClinicalOrderItems(DepartmentId, Status, ScheduledAtUtc);
GO

/* ================================================================
   STAGE 4 - One common result envelope for every clinical service
   ================================================================ */
IF OBJECT_ID(N'dbo.InvestigationResults', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.InvestigationResults
    (
        Id                  UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT PK_InvestigationResults PRIMARY KEY
            DEFAULT (NEWSEQUENTIALID()),
        ClinicalOrderItemId UNIQUEIDENTIFIER NOT NULL,
        PerformedByUserId   UNIQUEIDENTIFIER NULL,
        VerifiedByUserId    UNIQUEIDENTIFIER NULL,
        Status              VARCHAR(20) NOT NULL
            CONSTRAINT DF_InvestigationResults_Status DEFAULT ('Draft'),
        Summary             NVARCHAR(4000) NULL,
        Conclusion          NVARCHAR(4000) NULL,
        ResultDataJson      NVARCHAR(MAX) NULL,
        PerformedAtUtc      DATETIME2(0) NULL,
        VerifiedAtUtc       DATETIME2(0) NULL,
        Version             INT NOT NULL
            CONSTRAINT DF_InvestigationResults_Version DEFAULT (1),
        CreatedAtUtc        DATETIME2(0) NOT NULL
            CONSTRAINT DF_InvestigationResults_CreatedAtUtc DEFAULT (SYSUTCDATETIME()),
        RowVersion          ROWVERSION NOT NULL,
        CONSTRAINT UQ_InvestigationResults_OrderItem UNIQUE (ClinicalOrderItemId),
        CONSTRAINT CK_InvestigationResults_Status CHECK
            (Status IN ('Draft','InProgress','Completed','Verified','Amended','Cancelled')),
        CONSTRAINT FK_InvestigationResults_OrderItem
            FOREIGN KEY (ClinicalOrderItemId) REFERENCES dbo.ClinicalOrderItems(Id),
        CONSTRAINT FK_InvestigationResults_PerformedBy
            FOREIGN KEY (PerformedByUserId) REFERENCES dbo.Users(Id),
        CONSTRAINT FK_InvestigationResults_VerifiedBy
            FOREIGN KEY (VerifiedByUserId) REFERENCES dbo.Users(Id),
        CONSTRAINT CK_InvestigationResults_ResultDataJson
            CHECK (ResultDataJson IS NULL OR ISJSON(ResultDataJson) = 1)
    );
END;
GO

IF OBJECT_ID(N'dbo.LaboratoryResultItems', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.LaboratoryResultItems
    (
        Id                      UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT PK_LaboratoryResultItems PRIMARY KEY
            DEFAULT (NEWSEQUENTIALID()),
        InvestigationResultId   UNIQUEIDENTIFIER NOT NULL,
        TestCode                VARCHAR(50) NOT NULL,
        TestName                NVARCHAR(200) NOT NULL,
        ValueText               NVARCHAR(200) NULL,
        NumericValue            DECIMAL(18,6) NULL,
        Unit                    VARCHAR(50) NULL,
        ReferenceRange          NVARCHAR(100) NULL,
        AbnormalFlag            VARCHAR(20) NULL,
        SortOrder               INT NOT NULL
            CONSTRAINT DF_LaboratoryResultItems_SortOrder DEFAULT (0),
        CONSTRAINT FK_LaboratoryResultItems_Result
            FOREIGN KEY (InvestigationResultId) REFERENCES dbo.InvestigationResults(Id),
        CONSTRAINT CK_LaboratoryResultItems_AbnormalFlag CHECK
            (AbnormalFlag IS NULL OR AbnormalFlag IN ('Low','High','Critical','Normal','Abnormal'))
    );
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = N'IX_LaboratoryResultItems_TestCode'
                 AND object_id = OBJECT_ID(N'dbo.LaboratoryResultItems'))
    CREATE INDEX IX_LaboratoryResultItems_TestCode
        ON dbo.LaboratoryResultItems(TestCode, AbnormalFlag);
GO

/* ================================================================
   STAGE 5 - Inter-department consultation
   ================================================================ */
IF OBJECT_ID(N'dbo.ConsultationRequests', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ConsultationRequests
    (
        Id                  UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT PK_ConsultationRequests PRIMARY KEY
            DEFAULT (NEWSEQUENTIALID()),
        AppointmentId       UNIQUEIDENTIFIER NOT NULL,
        ClinicalOrderId     UNIQUEIDENTIFIER NULL,
        RequestedByDoctorId UNIQUEIDENTIFIER NOT NULL,
        TargetDepartmentId  INT NOT NULL,
        AssignedDoctorId    UNIQUEIDENTIFIER NULL,
        Reason              NVARCHAR(4000) NOT NULL,
        Priority            VARCHAR(20) NOT NULL
            CONSTRAINT DF_ConsultationRequests_Priority DEFAULT ('Routine'),
        Status              VARCHAR(20) NOT NULL
            CONSTRAINT DF_ConsultationRequests_Status DEFAULT ('Requested'),
        Response            NVARCHAR(4000) NULL,
        RequestedAtUtc      DATETIME2(0) NOT NULL
            CONSTRAINT DF_ConsultationRequests_RequestedAtUtc DEFAULT (SYSUTCDATETIME()),
        RespondedAtUtc      DATETIME2(0) NULL,
        CONSTRAINT CK_ConsultationRequests_Status CHECK
            (Status IN ('Requested','Accepted','InProgress','Completed','Rejected','Cancelled')),
        CONSTRAINT CK_ConsultationRequests_Priority CHECK
            (Priority IN ('Routine','Urgent','Stat')),
        CONSTRAINT FK_ConsultationRequests_Appointment
            FOREIGN KEY (AppointmentId) REFERENCES dbo.Appointments(Id),
        CONSTRAINT FK_ConsultationRequests_Order
            FOREIGN KEY (ClinicalOrderId) REFERENCES dbo.ClinicalOrders(Id),
        CONSTRAINT FK_ConsultationRequests_Requester
            FOREIGN KEY (RequestedByDoctorId) REFERENCES dbo.DoctorProfiles(UserId),
        CONSTRAINT FK_ConsultationRequests_TargetDepartment
            FOREIGN KEY (TargetDepartmentId) REFERENCES dbo.Departments(Id),
        CONSTRAINT FK_ConsultationRequests_Assignee
            FOREIGN KEY (AssignedDoctorId) REFERENCES dbo.DoctorProfiles(UserId)
    );
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = N'IX_ConsultationRequests_Department_Status'
                 AND object_id = OBJECT_ID(N'dbo.ConsultationRequests'))
    CREATE INDEX IX_ConsultationRequests_Department_Status
        ON dbo.ConsultationRequests(TargetDepartmentId, Status, RequestedAtUtc);
GO

/* ================================================================
   STAGE 6 - Minimal catalog seed. Safe because codes are unique.
   ================================================================ */
INSERT dbo.Departments (Code, Name)
SELECT v.Code, v.Name
FROM (VALUES
    ('GASTRO', N'Nội tiêu hóa'),
    ('LAB', N'Khoa Xét nghiệm'),
    ('IMAGING', N'Chẩn đoán hình ảnh'),
    ('ENDOSCOPY', N'Thăm dò chức năng - Nội soi'),
    ('SURGERY', N'Ngoại tiêu hóa')
) v(Code, Name)
WHERE NOT EXISTS (SELECT 1 FROM dbo.Departments d WHERE d.Code = v.Code);
GO

INSERT dbo.ClinicalServices
    (DepartmentId, Code, Name, ServiceType, RequiresPayment)
SELECT d.Id, v.Code, v.Name, v.ServiceType, v.RequiresPayment
FROM (VALUES
    ('LAB', 'CBC', N'Xét nghiệm máu cơ bản', 'Laboratory', 1),
    ('IMAGING', 'US-ABD', N'Siêu âm ổ bụng tổng quát', 'Ultrasound', 1),
    ('ENDOSCOPY', 'EGD', N'Nội soi thực quản - dạ dày - tá tràng', 'Endoscopy', 1)
) v(DepartmentCode, Code, Name, ServiceType, RequiresPayment)
JOIN dbo.Departments d ON d.Code = v.DepartmentCode
WHERE NOT EXISTS (SELECT 1 FROM dbo.ClinicalServices s WHERE s.Code = v.Code);
GO

/* Verification: list only objects created by this script. */
SELECT t.name AS TableName
FROM sys.tables t
WHERE t.name IN
(
    'Departments','ClinicalServices','DoctorDepartments',
    'ClinicalOrders','ClinicalOrderItems','InvestigationResults',
    'LaboratoryResultItems','ConsultationRequests'
)
ORDER BY t.name;
GO
