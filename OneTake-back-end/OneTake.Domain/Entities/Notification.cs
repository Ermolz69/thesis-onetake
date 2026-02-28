using System;
using OneTake.Domain.Common;
using OneTake.Domain.Enums;

namespace OneTake.Domain.Entities
{
    public class Notification : Entity
    {
        public Guid UserId { get; set; }
        public NotificationType Type { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
        public string? EntityType { get; set; }
        public Guid? EntityId { get; set; }
        public bool IsRead { get; set; }


        public User? User { get; set; }
    }
}
