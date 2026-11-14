using System.Net.Http.Json;
using System.Text.Json.Serialization;

namespace RepoRadar;

internal sealed record Repository(
    [property: JsonPropertyName("full_name")] string FullName,
    [property: JsonPropertyName("description")] string? Description,
    [property: JsonPropertyName("language")] string? Language,
    [property: JsonPropertyName("stars")] int Stars,
    [property: JsonPropertyName("html_url")] string Url,
    [property: JsonPropertyName("total_count")] long Total);

internal static class CatalogClient
{
    public const int PageSize = 48;
    // Public client configuration, identical to the website.
    private const string BaseUrl = "https://tlqsmwsjeogudgijnpnu.supabase.co";
    private const string PublicKey = "sb_publishable_JZI-XLfqRhq1jzYwxaFdQg_bQMyy5ob";
    private static readonly HttpClient Http = new() { Timeout = TimeSpan.FromSeconds(25) };

    public static async Task<Repository[]> SearchAsync(
        string query, string category, string language, string sort, int offset, CancellationToken token, bool includeDescription = false)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, BaseUrl + "/rest/v1/rpc/search_catalog");
        request.Headers.Add("apikey", PublicKey);
        request.Headers.Add("Content-Profile", "repo_radar");
        request.Headers.Add("Accept-Profile", "repo_radar");
        if (PublicKey.StartsWith("eyJ", StringComparison.Ordinal))
            request.Headers.Authorization = new("Bearer", PublicKey);
        request.Content = JsonContent.Create(new
        {
            q = query.Trim(), category_filter = category, language_filter = language,
            sort_by = sort, include_description = includeDescription, page_size = PageSize, page_offset = offset
        });
        using var response = await Http.SendAsync(request, token);
        if (!response.IsSuccessStatusCode)
        {
            var detail = await response.Content.ReadAsStringAsync(token);
            throw new HttpRequestException($"Catalog HTTP {(int)response.StatusCode}: {detail[..Math.Min(detail.Length, 400)]}");
        }
        return await response.Content.ReadFromJsonAsync<Repository[]>(cancellationToken: token)
            ?? throw new InvalidDataException("Supabase returned an empty response.");
    }
}
