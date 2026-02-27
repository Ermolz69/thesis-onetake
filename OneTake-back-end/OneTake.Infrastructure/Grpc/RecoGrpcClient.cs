using Grpc.Net.Client;
using Microsoft.Extensions.Configuration;
using OneTake.Application.Common.Interfaces;
using OneTake.GrpcContracts.Reco.V1;

namespace OneTake.Infrastructure.Grpc;

public class RecoGrpcClient : IRecommendationsClient
{
    private readonly RecoService.RecoServiceClient _client;

    public RecoGrpcClient(IConfiguration configuration)
    {
        var url = configuration["GRPC_RECO_URL"] ?? "http://localhost:50052";
        var channel = GrpcChannel.ForAddress(url);
        _client = new RecoService.RecoServiceClient(channel);
    }

    public async Task<GetRecommendationsResponse> GetRecommendationsAsync(GetRecommendationsRequest request, CancellationToken cancellationToken = default)
    {
        return await _client.GetRecommendationsAsync(request, cancellationToken: cancellationToken);
    }
}
