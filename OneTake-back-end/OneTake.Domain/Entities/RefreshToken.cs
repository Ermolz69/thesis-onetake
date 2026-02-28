using System;
using OneTake.Domain.Common;

namespace OneTake.Domain.Entities
{
    public class RefreshToken : Entity
    {
        public Guid UserId { get; set; }
        public string TokenHash { get; set; } = string.Empty;
        public DateTime ExpiresAt { get; set; }
        public DateTime? UsedAt { get; set; }
        public DateTime? RevokedAt { get; set; }
        public Guid? ReplacedByTokenId { get; set; }

        public User? User { get; set; }
    }
}
