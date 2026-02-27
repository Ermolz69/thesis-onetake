using System;
using OneTake.Domain.Common;

namespace OneTake.Domain.Entities
{
    public class Profile : Entity
    {
        public Guid UserId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string? Bio { get; set; }
        public string? AvatarUrl { get; set; }

        // Navigation property
        public User? User { get; set; }
    }
}

