import os
import sys
from importlib import reload
from unittest import mock

from django.core.exceptions import ImproperlyConfigured
from django.test import SimpleTestCase


class SecretKeySettingsTests(SimpleTestCase):
    def test_production_mode_without_secret_key_raises_error(self):
        """In DEBUG=False mode, if SECRET_KEY is missing or set to insecure default, raise ImproperlyConfigured."""
        with mock.patch.dict(os.environ, {"DEBUG": "False", "SECRET_KEY": "django-insecure-change-this-in-production"}, clear=True):
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
