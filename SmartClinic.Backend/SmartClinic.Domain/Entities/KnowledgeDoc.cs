using System;
using System.Collections.Generic;

namespace SmartClinic.Domain.Entities;

public partial class KnowledgeDoc
{
    public Guid Id { get; set; }

    public string Title { get; set; } = null!;

    public string FileUrl { get; set; } = null!;

    public DateTime? UploadedAt { get; set; }

    public bool? IsVectorized { get; set; }
}
