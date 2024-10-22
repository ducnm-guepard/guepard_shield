import os
from typing import Set, Any
import aiofiles
from dataclasses import dataclass


@dataclass
class SimilarityResult:
    is_similar: bool
    similar_to: str = ""
    similarity: float = 0.0


@dataclass
class AppendResult:
    success: bool
    reason: str = ""
    similarity: float = 0.0
    similar_to: str = ""
    error: Any = None
    message: str = ""


class UniqueLineAppender:
    def __init__(self, file_path: str, similarity_threshold: float = 0.8):
        self.file_path = file_path
        self.similarity_threshold = similarity_threshold
        self.cache: Set[str] = set()
        self.is_initialized = False

    @staticmethod
    def calculate_similarity(str1: str, str2: str) -> float:
        """Calculate similarity between two strings using Levenshtein Distance."""
        if len(str1) > len(str2):
            str1, str2 = str2, str1

        distances = [[0] * (len(str2) + 1) for _ in range(len(str1) + 1)]

        for i in range(len(str1) + 1):
            distances[i][0] = i
        for j in range(len(str2) + 1):
            distances[0][j] = j

        for i in range(1, len(str1) + 1):
            for j in range(1, len(str2) + 1):
                cost = 0 if str1[i - 1] == str2[j - 1] else 1
                distances[i][j] = min(
                    distances[i - 1][j] + 1,  # deletion
                    distances[i][j - 1] + 1,  # insertion
                    distances[i - 1][j - 1] + cost,  # substitution
                )

        max_length = max(len(str1), len(str2))
        return 1 - distances[len(str1)][len(str2)] / max_length

    async def initialize(self) -> None:
        """Initialize the cache by reading existing file."""
        try:
            # Create file if it doesn't exist
            os.makedirs(os.path.dirname(self.file_path), exist_ok=True)
            if not os.path.exists(self.file_path):
                async with aiofiles.open(self.file_path, "w") as f:
                    await f.write("")

            # Read existing lines
            async with aiofiles.open(self.file_path, "r") as f:
                async for line in f:
                    line = line.strip()
                    if line:
                        self.cache.add(line)

            self.is_initialized = True
            print(f"Initialized with {len(self.cache)} lines from file")

        except Exception as error:
            print(f"Error initializing cache: {error}")
            raise

    def is_similar_to_existing(self, new_line: str) -> SimilarityResult:
        """Check if a line is similar to any existing line in the cache."""
        for existing_line in self.cache:
            similarity = self.calculate_similarity(new_line, existing_line)
            if similarity >= self.similarity_threshold:
                return SimilarityResult(
                    is_similar=True, similar_to=existing_line, similarity=similarity
                )
        return SimilarityResult(is_similar=False)

    async def append_line(self, new_line: str) -> AppendResult:
        """Append a new line if it's not similar to existing lines."""
        if not self.is_initialized:
            await self.initialize()

        new_line = new_line.strip()
        if not new_line:
            return AppendResult(success=False, reason="Empty line")

        similarity_check = self.is_similar_to_existing(new_line)
        if similarity_check.is_similar:
            return AppendResult(
                success=False,
                reason="Similar line exists",
                similarity=similarity_check.similarity,
                similar_to=similarity_check.similar_to,
            )

        try:
            async with aiofiles.open(self.file_path, "a") as f:
                await f.write(new_line + "\n")
            self.cache.add(new_line)
            return AppendResult(success=True, message="Line appended successfully")
        except Exception as error:
            return AppendResult(
                success=False, reason="Error appending to file", error=error
            )

    async def refresh(self) -> None:
        """Clear cache and re-read the file."""
        self.cache.clear()
        self.is_initialized = False
        await self.initialize()

    def get_line_count(self) -> int:
        """Get the current number of lines in cache."""
        return len(self.cache)
