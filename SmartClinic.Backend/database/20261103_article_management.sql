/*
SmartClinic - Article management (SQL Server 2016+).
In SSMS, select the intended SmartClinic database before executing this script.
Requires existing dbo.Users(Id uniqueidentifier).
Adds four tables; does not alter existing clinical tables or import demo articles.
Can be rerun for objects created by this script. It does not upgrade other schemas.
ContentHtml must be sanitized by the backend; SQL cannot make HTML safe.
*/
SET NOCOUNT ON;
SET XACT_ABORT ON;

BEGIN TRY
    BEGIN TRANSACTION;

    IF OBJECT_ID(N'dbo.Users', N'U') IS NULL
        THROW 50001, 'dbo.Users was not found. Select the correct database.', 1;

    IF NOT EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = OBJECT_ID(N'dbo.Users') AND name = N'Id'
          AND system_type_id = TYPE_ID(N'uniqueidentifier')
    )
        THROW 50002, 'Expected dbo.Users.Id to be uniqueidentifier.', 1;

    IF OBJECT_ID(N'dbo.ArticleCategories', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.ArticleCategories (
            Id int IDENTITY(1,1) NOT NULL,
            Name nvarchar(150) NOT NULL,
            Slug varchar(180) NOT NULL,
            Description nvarchar(500) NULL,
            SortOrder int NOT NULL CONSTRAINT DF_ArticleCategories_SortOrder DEFAULT (0),
            IsActive bit NOT NULL CONSTRAINT DF_ArticleCategories_IsActive DEFAULT (1),
            CreatedAtUtc datetime2(3) NOT NULL
                CONSTRAINT DF_ArticleCategories_CreatedAtUtc DEFAULT SYSUTCDATETIME(),
            CONSTRAINT PK_ArticleCategories PRIMARY KEY (Id),
            CONSTRAINT UQ_ArticleCategories_Slug UNIQUE (Slug),
            CONSTRAINT CK_ArticleCategories_Name CHECK (LEN(LTRIM(RTRIM(Name))) > 0),
            CONSTRAINT CK_ArticleCategories_Slug CHECK (LEN(LTRIM(RTRIM(Slug))) > 0)
        );
    END;

    IF OBJECT_ID(N'dbo.MediaAssets', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.MediaAssets (
            Id uniqueidentifier NOT NULL CONSTRAINT DF_MediaAssets_Id DEFAULT NEWSEQUENTIALID(),
            StorageKey nvarchar(500) NOT NULL,
            OriginalFileName nvarchar(255) NOT NULL,
            ContentType varchar(100) NOT NULL,
            SizeBytes bigint NOT NULL,
            AltText nvarchar(300) NULL,
            UploadedByUserId uniqueidentifier NOT NULL,
            CreatedAtUtc datetime2(3) NOT NULL
                CONSTRAINT DF_MediaAssets_CreatedAtUtc DEFAULT SYSUTCDATETIME(),
            CONSTRAINT PK_MediaAssets PRIMARY KEY (Id),
            CONSTRAINT FK_MediaAssets_UploadedByUser FOREIGN KEY (UploadedByUserId)
                REFERENCES dbo.Users(Id),
            CONSTRAINT CK_MediaAssets_SizeBytes CHECK (SizeBytes > 0),
            CONSTRAINT CK_MediaAssets_StorageKey CHECK (LEN(LTRIM(RTRIM(StorageKey))) > 0)
        );
        CREATE INDEX IX_MediaAssets_UploadedByUserId ON dbo.MediaAssets(UploadedByUserId);
    END;

    IF OBJECT_ID(N'dbo.Articles', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.Articles (
            Id uniqueidentifier NOT NULL CONSTRAINT DF_Articles_Id DEFAULT NEWSEQUENTIALID(),
            CategoryId int NOT NULL,
            Title nvarchar(300) NOT NULL,
            Slug varchar(350) NOT NULL,
            Summary nvarchar(1000) NULL,
            ContentHtml nvarchar(max) NULL,
            CoverMediaId uniqueidentifier NULL,
            AuthorDisplayName nvarchar(200) NULL,
            Status varchar(20) NOT NULL CONSTRAINT DF_Articles_Status DEFAULT ('Draft'),
            IsFeatured bit NOT NULL CONSTRAINT DF_Articles_IsFeatured DEFAULT (0),
            ViewsCount bigint NOT NULL CONSTRAINT DF_Articles_ViewsCount DEFAULT (0),
            SeoTitle nvarchar(160) NULL,
            SeoDescription nvarchar(320) NULL,
            CreatedByUserId uniqueidentifier NOT NULL,
            UpdatedByUserId uniqueidentifier NULL,
            PublishedByUserId uniqueidentifier NULL,
            CreatedAtUtc datetime2(3) NOT NULL
                CONSTRAINT DF_Articles_CreatedAtUtc DEFAULT SYSUTCDATETIME(),
            UpdatedAtUtc datetime2(3) NULL,
            PublishedAtUtc datetime2(3) NULL,
            RowVersion rowversion NOT NULL,
            CONSTRAINT PK_Articles PRIMARY KEY (Id),
            CONSTRAINT UQ_Articles_Slug UNIQUE (Slug),
            CONSTRAINT FK_Articles_Category FOREIGN KEY (CategoryId)
                REFERENCES dbo.ArticleCategories(Id),
            CONSTRAINT FK_Articles_CoverMedia FOREIGN KEY (CoverMediaId)
                REFERENCES dbo.MediaAssets(Id),
            CONSTRAINT FK_Articles_CreatedByUser FOREIGN KEY (CreatedByUserId)
                REFERENCES dbo.Users(Id),
            CONSTRAINT FK_Articles_UpdatedByUser FOREIGN KEY (UpdatedByUserId)
                REFERENCES dbo.Users(Id),
            CONSTRAINT FK_Articles_PublishedByUser FOREIGN KEY (PublishedByUserId)
                REFERENCES dbo.Users(Id),
            CONSTRAINT CK_Articles_Title CHECK (LEN(LTRIM(RTRIM(Title))) > 0),
            CONSTRAINT CK_Articles_Slug CHECK (LEN(LTRIM(RTRIM(Slug))) > 0),
            CONSTRAINT CK_Articles_Status CHECK (Status IN ('Draft', 'Published', 'Archived')),
            CONSTRAINT CK_Articles_ViewsCount CHECK (ViewsCount >= 0),
            CONSTRAINT CK_Articles_PublishedContent CHECK (
                Status <> 'Published' OR (
                    PublishedAtUtc IS NOT NULL AND PublishedByUserId IS NOT NULL
                    AND CoverMediaId IS NOT NULL
                    AND Summary IS NOT NULL AND LEN(LTRIM(RTRIM(Summary))) > 0
                    AND ContentHtml IS NOT NULL AND LEN(LTRIM(RTRIM(ContentHtml))) > 0
                )
            )
        );
        CREATE INDEX IX_Articles_PublicList
            ON dbo.Articles(Status, PublishedAtUtc DESC, Id)
            INCLUDE (CategoryId, Title, Slug, CoverMediaId, IsFeatured);
        CREATE INDEX IX_Articles_CategoryPublicList
            ON dbo.Articles(CategoryId, Status, PublishedAtUtc DESC, Id);
        CREATE INDEX IX_Articles_CoverMediaId ON dbo.Articles(CoverMediaId);
        CREATE INDEX IX_Articles_CreatedByUserId ON dbo.Articles(CreatedByUserId);
    END;

    IF OBJECT_ID(N'dbo.ArticleRevisions', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.ArticleRevisions (
            Id uniqueidentifier NOT NULL
                CONSTRAINT DF_ArticleRevisions_Id DEFAULT NEWSEQUENTIALID(),
            ArticleId uniqueidentifier NOT NULL,
            RevisionNumber int NOT NULL,
            SnapshotJson nvarchar(max) NOT NULL,
            ChangedByUserId uniqueidentifier NOT NULL,
            ChangedAtUtc datetime2(3) NOT NULL
                CONSTRAINT DF_ArticleRevisions_ChangedAtUtc DEFAULT SYSUTCDATETIME(),
            ChangeNote nvarchar(500) NULL,
            CONSTRAINT PK_ArticleRevisions PRIMARY KEY (Id),
            CONSTRAINT FK_ArticleRevisions_Article FOREIGN KEY (ArticleId)
                REFERENCES dbo.Articles(Id),
            CONSTRAINT FK_ArticleRevisions_ChangedByUser FOREIGN KEY (ChangedByUserId)
                REFERENCES dbo.Users(Id),
            CONSTRAINT UQ_ArticleRevisions_ArticleVersion UNIQUE (ArticleId, RevisionNumber),
            CONSTRAINT CK_ArticleRevisions_Number CHECK (RevisionNumber > 0),
            CONSTRAINT CK_ArticleRevisions_Json CHECK (ISJSON(SnapshotJson) = 1)
        );
    END;

    -- Seed the initial categories. Preserve existing categories.
    INSERT INTO dbo.ArticleCategories(Name, Slug, SortOrder)
    SELECT source.Name, source.Slug, source.SortOrder
    FROM (VALUES
        (N'Hoạt động Bệnh viện', 'hoat-dong-benh-vien', 1),
        (N'Danh mục kỹ thuật', 'danh-muc-ky-thuat', 2),
        (N'Sức khỏe Cộng đồng', 'suc-khoe-cong-dong', 3),
        (N'Khoa học & Đào tạo', 'khoa-hoc-va-dao-tao', 4),
        (N'Thông báo Bệnh viện', 'thong-bao-benh-vien', 5)
    ) AS source(Name, Slug, SortOrder)
    WHERE NOT EXISTS (
        SELECT 1 FROM dbo.ArticleCategories existing WHERE existing.Slug = source.Slug
    );

    COMMIT TRANSACTION;
    PRINT N'Article management schema is ready.';
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;

-- Verify the selected database and new tables.
SELECT DB_NAME() AS CurrentDatabase;
SELECT name AS TableName FROM sys.tables
WHERE schema_id = SCHEMA_ID(N'dbo')
  AND name IN (N'ArticleCategories', N'MediaAssets', N'Articles', N'ArticleRevisions');
SELECT Id, Name, Slug, SortOrder FROM dbo.ArticleCategories ORDER BY SortOrder, Id;
