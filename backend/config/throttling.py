from rest_framework.throttling import AnonRateThrottle


class LoginRateThrottle(AnonRateThrottle):
    """Limit login attempts by client IP to reduce brute-force spam."""

    scope = "login"
