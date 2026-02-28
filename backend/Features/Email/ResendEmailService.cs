using Microsoft.Extensions.Options;
using Resend;

namespace Trackly.Backend.Features.Email;

public class ResendEmailService : IEmailService
{
    private readonly IResend _resend;
    private readonly ResendEmailOptions _options;

    public ResendEmailService(IResend resend, IOptions<ResendEmailOptions> options)
    {
        _resend = resend;
        _options = options.Value;
    }

    public async Task SendVerificationCodeAsync(string toEmail, string code, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_options.ApiKey))
            return;

        var from = string.IsNullOrWhiteSpace(_options.From) ? "Arrivo <onboarding@resend.dev>" : _options.From;
        var message = new EmailMessage
        {
            From = from,
            Subject = "Votre code de vérification Arrivo",
            HtmlBody = $@"
<!DOCTYPE html>
<html>
<head><meta charset=""utf-8""></head>
<body style=""font-family: sans-serif; line-height: 1.5; color: #333;"">
  <p>Bonjour,</p>
  <p>Voici votre code de vérification pour finaliser votre inscription sur Arrivo :</p>
  <p style=""font-size: 1.5rem; font-weight: bold; letter-spacing: 0.25em; color: #0D9488;"">{code}</p>
  <p>Ce code est valide 15 minutes. Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.</p>
  <p>— L'équipe Arrivo</p>
</body>
</html>"
        };
        message.To.Add(toEmail);

        await _resend.EmailSendAsync(message, cancellationToken);
    }
}
