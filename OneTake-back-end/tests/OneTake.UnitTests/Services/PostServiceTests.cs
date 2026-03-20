using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Moq;
using OneTake.Application.Common.Interfaces;
using OneTake.Application.Common.Results;
using OneTake.Application.DTOs.Posts;
using OneTake.Application.Services;
using OneTake.Domain.Entities;
using OneTake.Domain.Enums;
using Xunit;

namespace OneTake.UnitTests.Services
{
    public class PostServiceTests
    {
        [Fact]
        public async Task GetPostByIdAsync_ReturnsNotFound_WhenPostDoesNotExist()
        {
            Mock<IUnitOfWork> unitOfWorkMock = new Mock<IUnitOfWork>();
            Mock<IPostRepository> postsMock = new Mock<IPostRepository>();
            postsMock.Setup(r => r.GetByIdWithDetailsAsync(It.IsAny<Guid>())).ReturnsAsync((Post?)null);
            unitOfWorkMock.Setup(u => u.Posts).Returns(postsMock.Object);

            Mock<IFileStorage> fileStorageMock = new Mock<IFileStorage>();
            Mock<INotificationService> notificationMock = new Mock<INotificationService>();

            IPostService service = new PostService(unitOfWorkMock.Object, fileStorageMock.Object, notificationMock.Object);
            Result<PostDto> result = await service.GetPostByIdAsync(Guid.NewGuid());

            Assert.False(result.IsSuccess);
            Assert.NotNull(result.Error);
        }

        [Fact]
        public async Task GetPostByIdAsync_ReturnsSuccess_WhenPostExists()
        {
            Post post = new Post
            {
                ContentText = "Hi",
                MediaType = MediaType.Video,
                Visibility = Visibility.Public,
                AuthorId = Guid.NewGuid(),
                Author = new User { Username = "author" },
                Media = new MediaObject { Url = "https://example.com/v.mp4" },
                PostTags = new List<PostTag>()
            };
            Mock<IUnitOfWork> unitOfWorkMock = new Mock<IUnitOfWork>();
            Mock<IPostRepository> postsMock = new Mock<IPostRepository>();
            postsMock.Setup(r => r.GetByIdWithDetailsAsync(It.IsAny<Guid>())).ReturnsAsync(post);
            unitOfWorkMock.Setup(u => u.Posts).Returns(postsMock.Object);
            Mock<IReactionRepository> reactionsMock = new Mock<IReactionRepository>();
            reactionsMock.Setup(r => r.CountByPostAndTypeAsync(It.IsAny<Guid>(), It.IsAny<ReactionType>())).ReturnsAsync(0);
            unitOfWorkMock.Setup(u => u.Reactions).Returns(reactionsMock.Object);
            Mock<ICommentRepository> commentsMock = new Mock<ICommentRepository>();
            commentsMock.Setup(c => c.CountByPostIdAsync(It.IsAny<Guid>())).ReturnsAsync(0);
            unitOfWorkMock.Setup(u => u.Comments).Returns(commentsMock.Object);

            Mock<IFileStorage> fileStorageMock = new Mock<IFileStorage>();
            Mock<INotificationService> notificationMock = new Mock<INotificationService>();
            IPostService service = new PostService(unitOfWorkMock.Object, fileStorageMock.Object, notificationMock.Object);

            Result<PostDto> result = await service.GetPostByIdAsync(post.Id);

            Assert.True(result.IsSuccess);
            Assert.Equal("Hi", result.Value!.ContentText);
            Assert.Equal("author", result.Value.AuthorName);
        }

        [Fact]
        public async Task DeletePostAsync_ReturnsNotFound_WhenPostDoesNotExist()
        {
            Mock<IUnitOfWork> unitOfWorkMock = new Mock<IUnitOfWork>();
            Mock<IPostRepository> postsMock = new Mock<IPostRepository>();
            postsMock.Setup(r => r.GetByIdAsync(It.IsAny<Guid>())).ReturnsAsync((Post?)null);
            unitOfWorkMock.Setup(u => u.Posts).Returns(postsMock.Object);
            Mock<IFileStorage> fileStorageMock = new Mock<IFileStorage>();
            Mock<INotificationService> notificationMock = new Mock<INotificationService>();
            IPostService service = new PostService(unitOfWorkMock.Object, fileStorageMock.Object, notificationMock.Object);

            Result result = await service.DeletePostAsync(Guid.NewGuid(), Guid.NewGuid(), false);

            Assert.False(result.IsSuccess);
        }

        [Fact]
        public async Task DeletePostAsync_ReturnsForbidden_WhenNotOwnerAndCannotDelete()
        {
            Guid authorId = Guid.NewGuid();
            Guid userId = Guid.NewGuid();
            Post post = new Post { AuthorId = authorId };
            Mock<IUnitOfWork> unitOfWorkMock = new Mock<IUnitOfWork>();
            Mock<IPostRepository> postsMock = new Mock<IPostRepository>();
            postsMock.Setup(r => r.GetByIdAsync(It.IsAny<Guid>())).ReturnsAsync(post);
            unitOfWorkMock.Setup(u => u.Posts).Returns(postsMock.Object);
            Mock<IFileStorage> fileStorageMock = new Mock<IFileStorage>();
            Mock<INotificationService> notificationMock = new Mock<INotificationService>();
            IPostService service = new PostService(unitOfWorkMock.Object, fileStorageMock.Object, notificationMock.Object);

            Result result = await service.DeletePostAsync(post.Id, userId, canDelete: false);

            Assert.False(result.IsSuccess);
        }

        [Fact]
        public async Task LikePostAsync_ReturnsSuccess()
        {
            Guid postId = Guid.NewGuid();
            Guid userId = Guid.NewGuid();
            Post post = new Post { AuthorId = Guid.NewGuid() };
            Mock<IUnitOfWork> unitOfWorkMock = new Mock<IUnitOfWork>();
            Mock<IPostRepository> postsMock = new Mock<IPostRepository>();
            postsMock.Setup(r => r.GetByIdAsync(It.IsAny<Guid>())).ReturnsAsync(post);
            unitOfWorkMock.Setup(u => u.Posts).Returns(postsMock.Object);
            Mock<IReactionRepository> reactionsMock = new Mock<IReactionRepository>();
            reactionsMock.Setup(r => r.ExistsByPostAndUserAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<ReactionType>())).ReturnsAsync(false);
            unitOfWorkMock.Setup(u => u.Reactions).Returns(reactionsMock.Object);
            Mock<IFileStorage> fileStorageMock = new Mock<IFileStorage>();
            Mock<INotificationService> notificationMock = new Mock<INotificationService>();
            IPostService service = new PostService(unitOfWorkMock.Object, fileStorageMock.Object, notificationMock.Object);

            Result result = await service.LikePostAsync(postId, userId);

            Assert.True(result.IsSuccess);
            reactionsMock.Verify(r => r.AddAsync(It.Is<Reaction>(reaction => reaction.PostId == postId && reaction.UserId == userId)), Times.Once);
            unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
            notificationMock.Verify(
                n => n.CreateAsync(post.AuthorId, NotificationType.LikeOnPost, "New like", "Someone liked your post", "post", postId, It.IsAny<CancellationToken>()),
                Times.Once);
        }

        [Fact]
        public async Task LikePostAsync_ReturnsSuccessWithoutSideEffects_WhenAlreadyLiked()
        {
            Guid postId = Guid.NewGuid();
            Guid userId = Guid.NewGuid();
            Mock<IUnitOfWork> unitOfWorkMock = new Mock<IUnitOfWork>();
            Mock<IReactionRepository> reactionsMock = new Mock<IReactionRepository>();
            reactionsMock
                .Setup(r => r.ExistsByPostAndUserAsync(postId, userId, ReactionType.Like))
                .ReturnsAsync(true);
            unitOfWorkMock.Setup(u => u.Reactions).Returns(reactionsMock.Object);
            Mock<IPostRepository> postsMock = new Mock<IPostRepository>();
            unitOfWorkMock.Setup(u => u.Posts).Returns(postsMock.Object);
            Mock<IFileStorage> fileStorageMock = new Mock<IFileStorage>();
            Mock<INotificationService> notificationMock = new Mock<INotificationService>();

            IPostService service = new PostService(unitOfWorkMock.Object, fileStorageMock.Object, notificationMock.Object);
            Result result = await service.LikePostAsync(postId, userId);

            Assert.True(result.IsSuccess);
            reactionsMock.Verify(r => r.AddAsync(It.IsAny<Reaction>()), Times.Never);
            postsMock.Verify(r => r.GetByIdAsync(It.IsAny<Guid>()), Times.Never);
            unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
            notificationMock.Verify(
                n => n.CreateAsync(It.IsAny<Guid>(), It.IsAny<NotificationType>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<Guid?>(), It.IsAny<CancellationToken>()),
                Times.Never);
        }

        [Fact]
        public async Task LikePostAsync_DoesNotNotify_WhenAuthorLikesOwnPost()
        {
            Guid postId = Guid.NewGuid();
            Guid userId = Guid.NewGuid();
            Post post = new Post { Id = postId, AuthorId = userId };
            Mock<IUnitOfWork> unitOfWorkMock = new Mock<IUnitOfWork>();
            Mock<IPostRepository> postsMock = new Mock<IPostRepository>();
            postsMock.Setup(r => r.GetByIdAsync(postId)).ReturnsAsync(post);
            unitOfWorkMock.Setup(u => u.Posts).Returns(postsMock.Object);
            Mock<IReactionRepository> reactionsMock = new Mock<IReactionRepository>();
            reactionsMock
                .Setup(r => r.ExistsByPostAndUserAsync(postId, userId, ReactionType.Like))
                .ReturnsAsync(false);
            unitOfWorkMock.Setup(u => u.Reactions).Returns(reactionsMock.Object);
            Mock<IFileStorage> fileStorageMock = new Mock<IFileStorage>();
            Mock<INotificationService> notificationMock = new Mock<INotificationService>();

            IPostService service = new PostService(unitOfWorkMock.Object, fileStorageMock.Object, notificationMock.Object);
            Result result = await service.LikePostAsync(postId, userId);

            Assert.True(result.IsSuccess);
            notificationMock.Verify(
                n => n.CreateAsync(It.IsAny<Guid>(), It.IsAny<NotificationType>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<Guid?>(), It.IsAny<CancellationToken>()),
                Times.Never);
        }

        [Fact]
        public async Task UnlikePostAsync_ReturnsSuccess_WhenReactionExists()
        {
            Guid postId = Guid.NewGuid();
            Guid userId = Guid.NewGuid();
            Reaction reaction = new Reaction { PostId = postId, UserId = userId, Type = ReactionType.Like };
            Mock<IUnitOfWork> unitOfWorkMock = new Mock<IUnitOfWork>();
            Mock<IReactionRepository> reactionsMock = new Mock<IReactionRepository>();
            reactionsMock.Setup(r => r.GetByPostAndUserAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<ReactionType>())).ReturnsAsync(reaction);
            unitOfWorkMock.Setup(u => u.Reactions).Returns(reactionsMock.Object);
            Mock<IFileStorage> fileStorageMock = new Mock<IFileStorage>();
            Mock<INotificationService> notificationMock = new Mock<INotificationService>();
            IPostService service = new PostService(unitOfWorkMock.Object, fileStorageMock.Object, notificationMock.Object);

            Result result = await service.UnlikePostAsync(postId, userId);

            Assert.True(result.IsSuccess);
        }

        [Fact]
        public async Task GetPostsAsync_ReturnsSuccess_WhenNoTagNoAuthor()
        {
            List<Post> posts = new List<Post> { new Post { Author = new User { Username = "a" }, PostTags = new List<PostTag>() } };
            Mock<IUnitOfWork> unitOfWorkMock = new Mock<IUnitOfWork>();
            Mock<IPostRepository> postsMock = new Mock<IPostRepository>();
            postsMock.Setup(r => r.GetPostsWithCursorAsync(It.IsAny<string?>(), It.IsAny<int>())).ReturnsAsync((posts, false));
            unitOfWorkMock.Setup(u => u.Posts).Returns(postsMock.Object);
            Mock<IReactionRepository> reactionsMock = new Mock<IReactionRepository>();
            reactionsMock.Setup(r => r.CountByPostAndTypeAsync(It.IsAny<Guid>(), It.IsAny<ReactionType>())).ReturnsAsync(0);
            unitOfWorkMock.Setup(u => u.Reactions).Returns(reactionsMock.Object);
            Mock<ICommentRepository> commentsMock = new Mock<ICommentRepository>();
            commentsMock.Setup(c => c.CountByPostIdAsync(It.IsAny<Guid>())).ReturnsAsync(0);
            unitOfWorkMock.Setup(u => u.Comments).Returns(commentsMock.Object);
            Mock<IFileStorage> fileStorageMock = new Mock<IFileStorage>();
            Mock<INotificationService> notificationMock = new Mock<INotificationService>();
            IPostService service = new PostService(unitOfWorkMock.Object, fileStorageMock.Object, notificationMock.Object);

            Result<PagedPostResponse> result = await service.GetPostsAsync(null, null, null, 10);

            Assert.True(result.IsSuccess);
            Assert.NotNull(result.Value);
            Assert.Single(result.Value.Posts);
            Assert.False(result.Value.HasMore);
        }

        [Fact]
        public async Task GetPostsAsync_ReturnsSuccess_WhenAuthorIdProvided()
        {
            Guid authorId = Guid.NewGuid();
            List<Post> posts = new List<Post> { new Post { AuthorId = authorId, Author = new User { Username = "a" }, PostTags = new List<PostTag>() } };
            Mock<IUnitOfWork> unitOfWorkMock = new Mock<IUnitOfWork>();
            Mock<IPostRepository> postsMock = new Mock<IPostRepository>();
            postsMock.Setup(r => r.GetByAuthorIdWithCursorAsync(authorId, It.IsAny<string?>(), It.IsAny<int>())).ReturnsAsync((posts, false));
            unitOfWorkMock.Setup(u => u.Posts).Returns(postsMock.Object);
            Mock<IReactionRepository> reactionsMock = new Mock<IReactionRepository>();
            reactionsMock.Setup(r => r.CountByPostAndTypeAsync(It.IsAny<Guid>(), It.IsAny<ReactionType>())).ReturnsAsync(0);
            unitOfWorkMock.Setup(u => u.Reactions).Returns(reactionsMock.Object);
            Mock<ICommentRepository> commentsMock = new Mock<ICommentRepository>();
            commentsMock.Setup(c => c.CountByPostIdAsync(It.IsAny<Guid>())).ReturnsAsync(0);
            unitOfWorkMock.Setup(u => u.Comments).Returns(commentsMock.Object);
            Mock<IFileStorage> fileStorageMock = new Mock<IFileStorage>();
            Mock<INotificationService> notificationMock = new Mock<INotificationService>();
            IPostService service = new PostService(unitOfWorkMock.Object, fileStorageMock.Object, notificationMock.Object);

            Result<PagedPostResponse> result = await service.GetPostsAsync(null, authorId, null, 10);

            Assert.True(result.IsSuccess);
            Assert.Single(result.Value!.Posts);
        }

        [Fact]
        public async Task GetPostsAsync_ReturnsSuccess_WhenTagProvided()
        {
            List<Post> posts = new List<Post> { new Post { Author = new User { Username = "a" }, PostTags = new List<PostTag>() } };
            Mock<IUnitOfWork> unitOfWorkMock = new Mock<IUnitOfWork>();
            Mock<IPostRepository> postsMock = new Mock<IPostRepository>();
            postsMock.Setup(r => r.GetByTagWithCursorAsync("music", It.IsAny<string?>(), It.IsAny<int>())).ReturnsAsync((posts, false));
            unitOfWorkMock.Setup(u => u.Posts).Returns(postsMock.Object);
            Mock<IReactionRepository> reactionsMock = new Mock<IReactionRepository>();
            reactionsMock.Setup(r => r.CountByPostAndTypeAsync(It.IsAny<Guid>(), It.IsAny<ReactionType>())).ReturnsAsync(0);
            unitOfWorkMock.Setup(u => u.Reactions).Returns(reactionsMock.Object);
            Mock<ICommentRepository> commentsMock = new Mock<ICommentRepository>();
            commentsMock.Setup(c => c.CountByPostIdAsync(It.IsAny<Guid>())).ReturnsAsync(0);
            unitOfWorkMock.Setup(u => u.Comments).Returns(commentsMock.Object);
            Mock<IFileStorage> fileStorageMock = new Mock<IFileStorage>();
            Mock<INotificationService> notificationMock = new Mock<INotificationService>();
            IPostService service = new PostService(unitOfWorkMock.Object, fileStorageMock.Object, notificationMock.Object);

            Result<PagedPostResponse> result = await service.GetPostsAsync("music", null, null, 10);

            Assert.True(result.IsSuccess);
            Assert.Single(result.Value!.Posts);
        }

        [Fact]
        public async Task SearchPostsAsync_ReturnsSuccess()
        {
            List<Post> posts = new List<Post> { new Post { Author = new User { Username = "a" }, PostTags = new List<PostTag>() } };
            Mock<IUnitOfWork> unitOfWorkMock = new Mock<IUnitOfWork>();
            Mock<IPostRepository> postsMock = new Mock<IPostRepository>();
            postsMock.Setup(r => r.SearchAsync(It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<int>())).ReturnsAsync((posts, false));
            unitOfWorkMock.Setup(u => u.Posts).Returns(postsMock.Object);
            Mock<IReactionRepository> reactionsMock = new Mock<IReactionRepository>();
            reactionsMock.Setup(r => r.CountByPostAndTypeAsync(It.IsAny<Guid>(), It.IsAny<ReactionType>())).ReturnsAsync(0);
            unitOfWorkMock.Setup(u => u.Reactions).Returns(reactionsMock.Object);
            Mock<ICommentRepository> commentsMock = new Mock<ICommentRepository>();
            commentsMock.Setup(c => c.CountByPostIdAsync(It.IsAny<Guid>())).ReturnsAsync(0);
            unitOfWorkMock.Setup(u => u.Comments).Returns(commentsMock.Object);
            Mock<IFileStorage> fileStorageMock = new Mock<IFileStorage>();
            Mock<INotificationService> notificationMock = new Mock<INotificationService>();
            IPostService service = new PostService(unitOfWorkMock.Object, fileStorageMock.Object, notificationMock.Object);

            Result<PagedPostResponse> result = await service.SearchPostsAsync("query", null, 10);

            Assert.True(result.IsSuccess);
            Assert.Single(result.Value!.Posts);
        }

        [Fact]
        public async Task DeletePostAsync_ReturnsSuccess_WhenOwnerDeletes()
        {
            Guid userId = Guid.NewGuid();
            Post post = new Post { AuthorId = userId, MediaId = null };
            Mock<IUnitOfWork> unitOfWorkMock = new Mock<IUnitOfWork>();
            Mock<IPostRepository> postsMock = new Mock<IPostRepository>();
            postsMock.Setup(r => r.GetByIdAsync(It.IsAny<Guid>())).ReturnsAsync(post);
            unitOfWorkMock.Setup(u => u.Posts).Returns(postsMock.Object);
            Mock<IFileStorage> fileStorageMock = new Mock<IFileStorage>();
            Mock<INotificationService> notificationMock = new Mock<INotificationService>();
            IPostService service = new PostService(unitOfWorkMock.Object, fileStorageMock.Object, notificationMock.Object);

            Result result = await service.DeletePostAsync(post.Id, userId, false);

            Assert.True(result.IsSuccess);
            postsMock.Verify(r => r.Remove(post), Times.Once);
        }

        [Fact]
        public async Task DeletePostAsync_DeletesAssociatedMedia_WhenPostHasMedia()
        {
            Guid userId = Guid.NewGuid();
            MediaObject media = new MediaObject { Id = Guid.NewGuid(), Path = "media/test.mp4" };
            Post post = new Post { AuthorId = userId, MediaId = media.Id };
            Mock<IUnitOfWork> unitOfWorkMock = new Mock<IUnitOfWork>();
            Mock<IPostRepository> postsMock = new Mock<IPostRepository>();
            postsMock.Setup(r => r.GetByIdAsync(post.Id)).ReturnsAsync(post);
            unitOfWorkMock.Setup(u => u.Posts).Returns(postsMock.Object);
            Mock<IMediaObjectRepository> mediaMock = new Mock<IMediaObjectRepository>();
            mediaMock.Setup(r => r.GetByIdAsync(media.Id)).ReturnsAsync(media);
            unitOfWorkMock.Setup(u => u.MediaObjects).Returns(mediaMock.Object);
            Mock<IFileStorage> fileStorageMock = new Mock<IFileStorage>();
            Mock<INotificationService> notificationMock = new Mock<INotificationService>();

            IPostService service = new PostService(unitOfWorkMock.Object, fileStorageMock.Object, notificationMock.Object);
            Result result = await service.DeletePostAsync(post.Id, userId, false);

            Assert.True(result.IsSuccess);
            fileStorageMock.Verify(f => f.DeleteFileAsync(media.Path), Times.Once);
            mediaMock.Verify(r => r.Remove(media), Times.Once);
            postsMock.Verify(r => r.Remove(post), Times.Once);
        }

        [Fact]
        public async Task CreatePostAsync_ReturnsSuccess_WhenValidRequest()
        {
            Guid userId = Guid.NewGuid();
            var request = new CreatePostRequest("hello", new List<string> { "t1" }, null);
            using Stream fileStream = new MemoryStream();
            string fileName = "test.mp4";
            string contentType = "video/mp4";

            var media = new MediaObject { Id = Guid.NewGuid(), Url = "https://example.com/v.mp4", MediaType = MediaType.Video };
            var tag = new Tag { Id = Guid.NewGuid(), Name = "t1" };
            var postForGet = new Post
            {
                Id = Guid.NewGuid(),
                AuthorId = userId,
                ContentText = "hello",
                MediaType = MediaType.Video,
                Visibility = Visibility.Public,
                Author = new User { Username = "author" },
                Media = media,
                PostTags = new List<PostTag> { new PostTag { Tag = tag } }
            };

            Mock<IFileStorage> fileStorageMock = new Mock<IFileStorage>();
            fileStorageMock.Setup(f => f.SaveFileAsync(It.IsAny<Stream>(), It.IsAny<string>(), It.IsAny<MediaType>())).ReturnsAsync(media);

            Mock<IMediaObjectRepository> mediaMock = new Mock<IMediaObjectRepository>();
            mediaMock.Setup(r => r.AddAsync(It.IsAny<MediaObject>())).Returns(Task.CompletedTask);
            Mock<ITagRepository> tagsMock = new Mock<ITagRepository>();
            tagsMock.Setup(r => r.GetOrCreateByNameAsync(It.IsAny<string>())).ReturnsAsync(tag);
            Mock<IPostRepository> postsMock = new Mock<IPostRepository>();
            postsMock.Setup(r => r.AddAsync(It.IsAny<Post>())).Returns(Task.CompletedTask);
            postsMock.Setup(r => r.GetByIdWithDetailsAsync(It.IsAny<Guid>())).ReturnsAsync(postForGet);
            Mock<IReactionRepository> reactionsMock = new Mock<IReactionRepository>();
            reactionsMock.Setup(r => r.CountByPostAndTypeAsync(It.IsAny<Guid>(), It.IsAny<ReactionType>())).ReturnsAsync(0);
            Mock<ICommentRepository> commentsMock = new Mock<ICommentRepository>();
            commentsMock.Setup(c => c.CountByPostIdAsync(It.IsAny<Guid>())).ReturnsAsync(0);

            Mock<IUnitOfWork> unitOfWorkMock = new Mock<IUnitOfWork>();
            unitOfWorkMock.Setup(u => u.MediaObjects).Returns(mediaMock.Object);
            unitOfWorkMock.Setup(u => u.Tags).Returns(tagsMock.Object);
            unitOfWorkMock.Setup(u => u.Posts).Returns(postsMock.Object);
            unitOfWorkMock.Setup(u => u.Reactions).Returns(reactionsMock.Object);
            unitOfWorkMock.Setup(u => u.Comments).Returns(commentsMock.Object);
            unitOfWorkMock.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

            Mock<INotificationService> notificationMock = new Mock<INotificationService>();
            IPostService service = new PostService(unitOfWorkMock.Object, fileStorageMock.Object, notificationMock.Object);

            Result<PostDto> result = await service.CreatePostAsync(userId, request, fileStream, fileName, contentType);

            Assert.True(result.IsSuccess);
            Assert.NotNull(result.Value);
            Assert.Equal("hello", result.Value.ContentText);
            Assert.Equal("author", result.Value.AuthorName);
            Assert.Equal(media.Url, result.Value.MediaUrl);
            fileStorageMock.Verify(f => f.SaveFileAsync(It.IsAny<Stream>(), fileName, MediaType.Video), Times.Once);
            tagsMock.Verify(r => r.GetOrCreateByNameAsync("t1"), Times.Once);
            unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
        }

        [Fact]
        public async Task CreatePostAsync_UsesAudioMediaTypeAndDefaultVisibility_WhenContentIsNotVideo()
        {
            Guid userId = Guid.NewGuid();
            var request = new CreatePostRequest("podcast", null, null);
            using Stream fileStream = new MemoryStream();
            var media = new MediaObject
            {
                Id = Guid.NewGuid(),
                Url = "https://example.com/a.mp3",
                MediaType = MediaType.Audio
            };
            Post? createdPost = null;
            var postForGet = new Post
            {
                Id = Guid.NewGuid(),
                AuthorId = userId,
                ContentText = "podcast",
                MediaType = MediaType.Audio,
                Visibility = Visibility.Public,
                Author = new User { Username = "creator" },
                Media = media,
                PostTags = new List<PostTag>()
            };

            Mock<IFileStorage> fileStorageMock = new Mock<IFileStorage>();
            fileStorageMock
                .Setup(f => f.SaveFileAsync(It.IsAny<Stream>(), "episode.mp3", MediaType.Audio))
                .ReturnsAsync(media);
            Mock<IMediaObjectRepository> mediaMock = new Mock<IMediaObjectRepository>();
            Mock<ITagRepository> tagsMock = new Mock<ITagRepository>();
            Mock<IPostRepository> postsMock = new Mock<IPostRepository>();
            postsMock
                .Setup(r => r.AddAsync(It.IsAny<Post>()))
                .Callback<Post>(post => createdPost = post)
                .Returns(Task.CompletedTask);
            postsMock.Setup(r => r.GetByIdWithDetailsAsync(It.IsAny<Guid>())).ReturnsAsync(postForGet);
            Mock<IReactionRepository> reactionsMock = new Mock<IReactionRepository>();
            reactionsMock.Setup(r => r.CountByPostAndTypeAsync(It.IsAny<Guid>(), It.IsAny<ReactionType>())).ReturnsAsync(0);
            Mock<ICommentRepository> commentsMock = new Mock<ICommentRepository>();
            commentsMock.Setup(c => c.CountByPostIdAsync(It.IsAny<Guid>())).ReturnsAsync(0);
            Mock<IUnitOfWork> unitOfWorkMock = new Mock<IUnitOfWork>();
            unitOfWorkMock.Setup(u => u.MediaObjects).Returns(mediaMock.Object);
            unitOfWorkMock.Setup(u => u.Tags).Returns(tagsMock.Object);
            unitOfWorkMock.Setup(u => u.Posts).Returns(postsMock.Object);
            unitOfWorkMock.Setup(u => u.Reactions).Returns(reactionsMock.Object);
            unitOfWorkMock.Setup(u => u.Comments).Returns(commentsMock.Object);
            unitOfWorkMock.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);
            Mock<INotificationService> notificationMock = new Mock<INotificationService>();

            IPostService service = new PostService(unitOfWorkMock.Object, fileStorageMock.Object, notificationMock.Object);
            Result<PostDto> result = await service.CreatePostAsync(userId, request, fileStream, "episode.mp3", "audio/mpeg");

            Assert.True(result.IsSuccess);
            Assert.NotNull(createdPost);
            Assert.Equal(MediaType.Audio, createdPost!.MediaType);
            Assert.Equal(Visibility.Public, createdPost.Visibility);
            tagsMock.Verify(r => r.GetOrCreateByNameAsync(It.IsAny<string>()), Times.Never);
        }
    }
}
