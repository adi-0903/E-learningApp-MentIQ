import os
import sys
from importlib import reload
from unittest import mock

from django.core.exceptions import ImproperlyConfigured
from django.test import SimpleTestCase


class SecretKeySettingsTests(SimpleTestCase):
    def test_production_mode_without_secret_key_raises_error(self):
        """In DEBUG=False mode, if SECRET_KEY is missing or set to insecure default, raise ImproperlyConfigured."""
        insecure_keys = [
            "django-insecure-change-this-in-production",
            "django-insecure-random-dev-key",
            "dev-secret-key-mentiq",
            "your-secret-key-here-change-in-production",
            "change-me-in-production",
            "",
        ]
        for key in insecure_keys:
            with self.subTest(key=key):
                env_vars = {"DEBUG": "False"}
                if key != "":
                    env_vars["SECRET_KEY"] = key
                with mock.patch.dict(os.environ, env_vars, clear=True):
                    from config import settings
                    with self.assertRaises(ImproperlyConfigured):
                        reload(settings)

    def test_production_mode_with_valid_secret_key(self):
        """In DEBUG=False mode, if a valid SECRET_KEY is provided, it is set correctly."""
        valid_key = "a-very-secure-secret-key-for-production-environment"
        with mock.patch.dict(os.environ, {"DEBUG": "False", "SECRET_KEY": valid_key}, clear=True):
            from config import settings
            reload(settings)
            self.assertEqual(settings.SECRET_KEY, valid_key)

    def test_debug_mode_generates_random_secret_key_if_missing(self):
        """In DEBUG=True mode, if SECRET_KEY is missing or insecure default, a random key is generated."""
        with mock.patch.dict(os.environ, {"DEBUG": "True", "SECRET_KEY": ""}, clear=True):
            from config import settings
            reload(settings)
            self.assertTrue(bool(settings.SECRET_KEY))
            self.assertNotEqual(settings.SECRET_KEY, "")
            self.assertNotIn(settings.SECRET_KEY, settings._INSECURE_SECRET_KEYS)


class CorsSettingsTests(SimpleTestCase):
    def test_cors_allow_all_origins_disabled_in_debug_and_prod(self):
        """CORS_ALLOW_ALL_ORIGINS should not be enabled in either DEBUG=True or DEBUG=False."""
        for debug_val in ["True", "False"]:
            env_vars = {"DEBUG": debug_val}
            if debug_val == "False":
                env_vars["SECRET_KEY"] = "a-secure-key-for-test"
            with mock.patch.dict(os.environ, env_vars, clear=True):
                from config import settings
                reload(settings)
                self.assertFalse(getattr(settings, "CORS_ALLOW_ALL_ORIGINS", False))

    def test_cors_allowed_origins_default_when_env_not_set(self):
        """CORS_ALLOWED_ORIGINS defaults to local development origins if environment variable is not provided."""
        with mock.patch.dict(os.environ, {"DEBUG": "True"}, clear=True):
            from config import settings
            reload(settings)
            expected_defaults = ['http://localhost:3000', 'http://localhost:8081', 'http://localhost:5173']
            self.assertEqual(settings.CORS_ALLOWED_ORIGINS, expected_defaults)

    def test_cors_allowed_origins_custom_env(self):
        """CORS_ALLOWED_ORIGINS uses custom origins from environment variable when set."""
        custom_origins = "https://app.mentiq.com,https://admin.mentiq.com"
        with mock.patch.dict(os.environ, {"DEBUG": "True", "CORS_ALLOWED_ORIGINS": custom_origins}, clear=True):
            from config import settings
            reload(settings)
            self.assertEqual(settings.CORS_ALLOWED_ORIGINS, ["https://app.mentiq.com", "https://admin.mentiq.com"])
