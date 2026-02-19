namespace Trackly.Backend.Features.StadiaMaps;

/// <summary>
/// Décode une polyline encodée (format Valhalla/Google, précision 6) en liste de coordonnées [lng, lat].
/// </summary>
internal static class PolylineDecoder
{
    private const double InvPrecision = 1.0 / 1e6;

    public static IReadOnlyList<double[]> Decode(string encoded)
    {
        if (string.IsNullOrEmpty(encoded))
            return Array.Empty<double[]>();

        var coords = new List<double[]>();
        int i = 0;
        int lat = 0;
        int lng = 0;

        while (i < encoded.Length)
        {
            (var dlat, i) = DecodeSignedInt(encoded, i);
            (var dlng, i) = DecodeSignedInt(encoded, i);
            lat += dlat;
            lng += dlng;
            coords.Add(new[] { lng * InvPrecision, lat * InvPrecision });
        }

        return coords;
    }

    private static (int delta, int nextIndex) DecodeSignedInt(string encoded, int index)
    {
        int result = 0;
        int shift = 0;
        int i = index;

        while (i < encoded.Length)
        {
            int b = encoded[i++] - 63;
            result |= (b & 31) << shift;
            shift += 5;
            if (b < 32)
                break;
        }

        int delta = (result & 1) != 0 ? ~(result >> 1) : (result >> 1);
        return (delta, i);
    }
}
