using System;
using OneTake.Domain.Common;

namespace OneTake.Domain.Entities
{
    public class Follow : Entity
    {
        public Guid FollowerId { get; set; }
        public Guid FollowedId { get; set; }

        // Navigation properties
        public User? Follower { get; set; }
        public User? Followed { get; set; }
    }
}

