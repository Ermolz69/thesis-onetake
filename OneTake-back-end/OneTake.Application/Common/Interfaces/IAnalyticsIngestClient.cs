using OneTake.GrpcContracts.Analytics.V1;

namespace OneTake.Application.Common.Interfaces;

public interface IAnalyticsIngestClient
{
    Task TrackEventAsync(TrackEventRequest request, CancellationToken cancellationToken = default);
}
