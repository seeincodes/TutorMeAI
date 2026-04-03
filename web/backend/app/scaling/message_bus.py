"""In-process message bus for SSE distribution.

Provides a pub/sub abstraction that works in-process for single-instance
deployments. Can be swapped for Redis pub/sub when scaling horizontally
without changing the interface.
"""

from collections import defaultdict
from typing import Any, Callable, Coroutine


Handler = Callable[[dict[str, Any]], Coroutine[Any, Any, None]]


class MessageBus:
    """In-process pub/sub message bus."""

    def __init__(self) -> None:
        self._channels: dict[str, list[Handler]] = defaultdict(list)

    def subscribe(self, channel: str, handler: Handler) -> None:
        """Subscribe a handler to a channel."""
        self._channels[channel].append(handler)

    def unsubscribe(self, channel: str, handler: Handler) -> None:
        """Remove a handler from a channel."""
        handlers = self._channels.get(channel, [])
        if handler in handlers:
            handlers.remove(handler)

    async def publish(self, channel: str, message: dict[str, Any]) -> None:
        """Publish a message to all subscribers on a channel."""
        for handler in self._channels.get(channel, []):
            await handler(message)
