from django.contrib.staticfiles.storage import ManifestStaticFilesStorage

# Vite's build.assetsDir inside frontend/dist, which is a STATICFILES_DIRS entry.
VITE_ASSETS_PREFIX = "assets/"


class ViteManifestStaticFilesStorage(ManifestStaticFilesStorage):
    """Manifest storage that leaves Vite build output under its original names.

    Vite already puts a content hash in every filename it emits, and its chunks
    import each other by those names. Hashing them again gives the entry chunk
    a second URL, so a lazy chunk that imports it loads a separate copy of
    every module in it (including React).
    """

    def file_hash(self, name, content=None) -> str:
        """Skip hashing for Vite assets and hash everything else as usual."""
        # Django passes no name when hashing the manifest itself.
        if name and name.startswith(VITE_ASSETS_PREFIX):
            # An empty hash tells Django to keep the original filename.
            return ""
        return super().file_hash(name, content)
