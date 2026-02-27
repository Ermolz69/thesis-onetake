using System;
using System.Collections.Generic;
using OneTake.Domain.Common;

namespace OneTake.Domain.Entities
{
    public class Tag : Entity
    {
        public string Name { get; set; } = string.Empty;

        // Navigation properties
        public ICollection<PostTag> PostTags { get; set; } = new List<PostTag>();
    }
}

