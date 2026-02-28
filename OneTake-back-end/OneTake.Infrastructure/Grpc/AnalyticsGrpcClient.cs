using System.Diagnostics;
using Grpc.Net.Client;
using Microsoft.Extensions.Configuration;
using OneTake.Application.Common.Interfaces;
using OneTake.GrpcContracts.Analytics.V1;

namespace OneTake.Infrastructure.Grpc;

public class AnalyticsGrpcClient : IAnalyticsIngestClient
{
    private readonly AnalyticsIngest.AnalyticsIngestClient _client;

    public AnalyticsGrpcClient(IConfiguration configuration)
    {
        string? url = configuration["GRPC_ANALYTICS_URL"] ?? "http://localhost:50051";
        GrpcChannel channel = GrpcChannel.ForAddress(url);
        _client = new AnalyticsIngest.AnalyticsIngestClient(channel);
    }

    public async Task TrackEventAsync(TrackEventRequest request, CancellationToken cancellationToken = default)
    {
        await _client.TrackEventAsync(request, cancellationToken: cancellationToken);
    }
}
