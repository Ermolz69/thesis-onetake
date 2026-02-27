using OneTake.GrpcContracts.Reco.V1;

namespace OneTake.Application.Common.Interfaces;

public interface IRecommendationsClient
{
    Task<GetRecommendationsResponse> GetRecommendationsAsync(GetRecommendationsRequest request, CancellationToken cancellationToken = default);
}
