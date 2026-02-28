using System;
using System.Collections.Generic;
using OneTake.Domain.Common;
using OneTake.Domain.Enums;

namespace OneTake.Domain.Entities
{
    public class Post : Entity
    {
        public Guid AuthorId { get; set; }
        public string ContentText { get; set; } = string.Empty;
        public MediaType MediaType { get; set; }
        public Guid? MediaId { get; set; }
        public Visibility Visibility { get; set; } = Visibility.Public;

        // Navigation properties
        public User? Author { get; set; }
        public MediaObject? Media { get; set; }
        public ICollection<Comment> Comments { get; set; } = new List<Comment>();
        public ICollection<Reaction> Reactions { get; set; } = new List<Reaction>();
        public ICollection<PostTag> PostTags { get; set; } = new List<PostTag>();
    }
}

