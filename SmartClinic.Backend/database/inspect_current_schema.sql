-- Read-only metadata inspection. Select the intended SmartClinic database in SSMS.
-- Returns schema definitions, not patient data or authentication values.
SET NOCOUNT ON;
SELECT DB_NAME() AS CurrentDatabase;

SELECT s.name AS SchemaName, t.name AS TableName, c.column_id AS ColumnOrder,
       c.name AS ColumnName, ty.name AS TypeName,
       CASE WHEN c.max_length = -1 THEN -1
            WHEN ty.name IN (N'nvarchar', N'nchar') THEN c.max_length / 2
            ELSE c.max_length END AS DeclaredLength,
       c.precision AS NumericPrecision, c.scale AS NumericScale,
       c.is_nullable AS IsNullable, c.is_identity AS IsIdentity,
       dc.definition AS DefaultExpression,
       CASE WHEN EXISTS (
           SELECT 1 FROM sys.indexes i
           JOIN sys.index_columns ic ON ic.object_id = i.object_id AND ic.index_id = i.index_id
           WHERE i.object_id = t.object_id AND i.is_primary_key = 1 AND ic.column_id = c.column_id
       ) THEN 1 ELSE 0 END AS IsPrimaryKey
FROM sys.tables t
JOIN sys.schemas s ON s.schema_id = t.schema_id
JOIN sys.columns c ON c.object_id = t.object_id
JOIN sys.types ty ON ty.user_type_id = c.user_type_id
LEFT JOIN sys.default_constraints dc ON dc.object_id = c.default_object_id
WHERE t.is_ms_shipped = 0
ORDER BY s.name, t.name, c.column_id;

SELECT fk.name AS ForeignKeyName,
       OBJECT_SCHEMA_NAME(fk.parent_object_id) AS ChildSchema,
       OBJECT_NAME(fk.parent_object_id) AS ChildTable,
       COL_NAME(fkc.parent_object_id, fkc.parent_column_id) AS ChildColumn,
       OBJECT_SCHEMA_NAME(fk.referenced_object_id) AS ParentSchema,
       OBJECT_NAME(fk.referenced_object_id) AS ParentTable,
       COL_NAME(fkc.referenced_object_id, fkc.referenced_column_id) AS ParentColumn,
       fk.delete_referential_action_desc AS OnDelete,
       fk.update_referential_action_desc AS OnUpdate,
       fk.is_disabled AS IsDisabled, fk.is_not_trusted AS IsNotTrusted
FROM sys.foreign_keys fk
JOIN sys.foreign_key_columns fkc ON fkc.constraint_object_id = fk.object_id
ORDER BY ChildSchema, ChildTable, ForeignKeyName, fkc.constraint_column_id;

SELECT OBJECT_SCHEMA_NAME(i.object_id) AS SchemaName, OBJECT_NAME(i.object_id) AS TableName,
       i.name AS IndexName, i.is_unique AS IsUnique, i.is_primary_key AS IsPrimaryKey,
       COL_NAME(ic.object_id, ic.column_id) AS ColumnName, ic.key_ordinal AS KeyOrder,
       ic.is_included_column AS IsIncluded, i.filter_definition AS FilterExpression
FROM sys.indexes i
JOIN sys.index_columns ic ON ic.object_id = i.object_id AND ic.index_id = i.index_id
JOIN sys.tables t ON t.object_id = i.object_id
WHERE i.index_id > 0 AND t.is_ms_shipped = 0
ORDER BY SchemaName, TableName, IndexName, IsIncluded, KeyOrder;

SELECT OBJECT_SCHEMA_NAME(parent_object_id) AS SchemaName,
       OBJECT_NAME(parent_object_id) AS TableName,
       name AS CheckName, definition AS CheckExpression
FROM sys.check_constraints
ORDER BY SchemaName, TableName, CheckName;
