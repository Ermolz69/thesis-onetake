using System;
using OneTake.Domain.Common;
using OneTake.Domain.Enums;

namespace OneTake.Domain.Entities
{
    public class Reaction : Entity
    {
        public Guid PostId { get; set; }
        public Guid UserId { get; set; }
        public ReactionType Type { get; set; }

        // Navigation properties
        public Post? Post { get; set; }
        public User? User { get; set; }
    }
}

