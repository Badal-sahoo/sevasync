class DomainError(Exception):
    """Base class for all business logic errors."""


class NotFoundError(DomainError):
    """Raised when a requested resource does not exist."""


class PermissionDeniedError(DomainError):
    """Raised when the caller lacks permission to perform an action."""


class ValidationError(DomainError):
    """Raised when input fails business-level validation (not HTTP validation)."""


class ConflictError(DomainError):
    """Raised when an action conflicts with current state (e.g. duplicate assignment)."""
