using System;
using OneTake.Domain.Common;

namespace OneTake.Domain.Entities
{
    public class Comment : Entity
    {
        public Guid PostId { get; set; }
        public Guid UserId { get; set; }
        public string Text { get; set; } = string.Empty;

        // Navigation properties
        public Post? Post { get; set; }
        public User? User { get; set; }
    }
}

