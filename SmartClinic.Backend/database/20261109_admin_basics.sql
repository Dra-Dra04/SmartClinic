-- Run after 20261103_article_management.sql, on the intended SmartClinic database.
SET XACT_ABORT ON;

BEGIN TRY
    BEGIN TRANSACTION;

    IF OBJECT_ID(N'dbo.Users', N'U') IS NULL OR OBJECT_ID(N'dbo.Articles', N'U') IS NULL
        THROW 50010, 'Apply the SmartClinic base and article schemas first.', 1;

    IF COL_LENGTH(N'dbo.Users', N'IsActive') IS NULL
        ALTER TABLE dbo.Users ADD IsActive bit NOT NULL CONSTRAINT DF_Users_IsActive DEFAULT (1);
    IF COL_LENGTH(N'dbo.Users', N'SessionVersion') IS NULL
        ALTER TABLE dbo.Users ADD SessionVersion uniqueidentifier NULL;
    IF COL_LENGTH(N'dbo.Articles', N'ContentText') IS NULL
        ALTER TABLE dbo.Articles ADD ContentText nvarchar(max) NULL;

    IF OBJECT_ID(N'dbo.CK_Articles_PublishedContent', N'C') IS NOT NULL
        ALTER TABLE dbo.Articles DROP CONSTRAINT CK_Articles_PublishedContent;

    -- Compile after adding ContentText. Retain the publishing rule for legacy HTML rows.
    EXEC sys.sp_executesql N'
        ALTER TABLE dbo.Articles WITH CHECK ADD CONSTRAINT CK_Articles_PublishedContent CHECK (
            Status <> ''Published'' OR (
                PublishedAtUtc IS NOT NULL AND PublishedByUserId IS NOT NULL
                AND Summary IS NOT NULL AND LEN(LTRIM(RTRIM(Summary))) > 0
                AND (
                    (ContentText IS NOT NULL AND LEN(LTRIM(RTRIM(ContentText))) > 0)
                    OR (ContentText IS NULL AND CoverMediaId IS NOT NULL
                        AND ContentHtml IS NOT NULL AND LEN(LTRIM(RTRIM(ContentHtml))) > 0)
                )
            )
        );';
    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
