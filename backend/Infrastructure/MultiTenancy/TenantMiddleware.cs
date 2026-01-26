using System.Security.Claims;

namespace Trackly.Backend.Infrastructure.MultiTenancy;

public sealed class TenantMiddleware(RequestDelegate next)
{
    public const string TenantHeaderName = "X-Tenant-Id";

    public async Task InvokeAsync(HttpContext context, TenantContext tenantContext)
    {
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

        return Guid.Empty;
    }
}
