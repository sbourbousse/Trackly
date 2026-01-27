using System.Security.Claims;

namespace Trackly.Backend.Infrastructure.MultiTenancy;

public sealed class TenantMiddleware(RequestDelegate next)
{
    public const string TenantHeaderName = "X-Tenant-Id";

    public async Task InvokeAsync(HttpContext context, TenantContext tenantContext)
    {
        // Endpoints publics qui ne nécessitent pas de TenantId
        var path = context.Request.Path.Value ?? "";
        if (path == "/" ||
            path == "/health" ||
            path.StartsWith("/api/tenants/default") ||
            path.StartsWith("/api/tenants/register") ||
            path.StartsWith("/api/auth/register") ||
            path.StartsWith("/api/auth/login") ||
            (path.StartsWith("/api/drivers/") && path.EndsWith("/tenant")) ||
            path.StartsWith("/api/drivers/debug/") ||
            path.StartsWith("/hubs/")) // SignalR hubs - le tenantId sera géré dans le hub
        {
            await next(context);
            return;
        }

        var tenantId = ResolveTenantId(context);
        if (tenantId == null)
        {
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            await context.Response.WriteAsync("TenantId manquant ou invalide.");
            return;
        }

        tenantContext.TenantId = tenantId.Value;
        await next(context);
    }

    private static Guid? ResolveTenantId(HttpContext context)
    {
        if (context.Request.Headers.TryGetValue(TenantHeaderName, out var headerValue))
        {
            if (Guid.TryParse(headerValue, out var headerTenantId))
            {
                return headerTenantId;
            }

            return null;
        }

        var claimValue = context.User.FindFirstValue("tenant_id");
        if (!string.IsNullOrWhiteSpace(claimValue) && Guid.TryParse(claimValue, out var claimTenantId))
        {
            return claimTenantId;
        }

        return null;
    }
}
