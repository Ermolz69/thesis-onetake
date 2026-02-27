using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using OneTake.Application.Common.Interfaces;
using OneTake.Infrastructure.Files;
using OneTake.Infrastructure.Grpc;
using OneTake.Infrastructure.Persistence;
using OneTake.Infrastructure.Repositories;
using OneTake.Infrastructure.Services;

namespace OneTake.Infrastructure
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
        {
            var connectionString = configuration.GetConnectionString("DefaultConnection");

            services.AddDbContext<AppDbContext>(options =>
                options.UseNpgsql(connectionString));

            services.AddScoped<IAppDbContext, AppDbContext>();

            services.AddScoped<IUnitOfWork, UnitOfWork>();
            
            services.AddScoped<IUserRepository, UserRepository>();
            services.AddScoped<IPostRepository, PostRepository>();
            services.AddScoped<ICommentRepository, CommentRepository>();
            services.AddScoped<IReactionRepository, ReactionRepository>();
            services.AddScoped<ITagRepository, TagRepository>();
            services.AddScoped<IProfileRepository, ProfileRepository>();
            services.AddScoped<IMediaObjectRepository, MediaObjectRepository>();
            services.AddScoped<IFollowRepository, FollowRepository>();

            services.AddSingleton<IPasswordHasher, BCryptPasswordHasher>();
            services.AddSingleton<IJwtProvider, JwtProvider>();
            services.AddSingleton<IAnalyticsIngestClient, AnalyticsGrpcClient>();
            services.AddSingleton<IRecommendationsClient, RecoGrpcClient>();
            services.AddScoped<IFileStorage>(provider =>
            {
                var webRootPath = configuration["WebRootPath"] 
                    ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
                return new LocalFileStorage(webRootPath);
            });

            return services;
        }
    }
}

