using Microsoft.Extensions.DependencyInjection;
using OneTake.Application.Services;

namespace OneTake.Application
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddApplication(this IServiceCollection services)
        {
            services.AddScoped<IAuthService, AuthService>();
            services.AddScoped<IPostService, PostService>();
            services.AddScoped<ICommentService, CommentService>();
            services.AddScoped<IUserService, UserService>();
            services.AddScoped<IAdminService, AdminService>();
            services.AddScoped<IFollowService, FollowService>();
            services.AddScoped<INotificationService, NotificationService>();
            return services;
        }
    }
}

