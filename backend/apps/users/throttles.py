"""
Custom throttles for user authentication and password reset endpoints.
"""
from rest_framework.throttling import SimpleRateThrottle


class PasswordResetRequestThrottle(SimpleRateThrottle):
    """Throttle for requesting password reset OTP."""
    scope = 'password_reset_request'

    def get_cache_key(self, request, view):
        return self.get_ident(request)


class PasswordResetVerifyThrottle(SimpleRateThrottle):
    """Throttle for verifying password reset OTP."""
    scope = 'password_reset_verify'

    def get_cache_key(self, request, view):
        return self.get_ident(request)
