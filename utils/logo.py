from functools import lru_cache

APEL_LOGO_URL = "https://www.saintlouisdagneux.fr/wp-content/uploads/2021/09/apel-logo-300x205.jpg"

@lru_cache(maxsize=1)
def get_logo():
    """Charge le logo APEL depuis l'URL et le met en cache. Retourne un emoji en fallback."""
    try:
        from PIL import Image
        from io import BytesIO
        import urllib.request
        req = urllib.request.Request(APEL_LOGO_URL, headers={"User-Agent": "Mozilla/5.0"})
        response = urllib.request.urlopen(req, timeout=5)
        return Image.open(BytesIO(response.read()))
    except Exception:
        return "📅"
