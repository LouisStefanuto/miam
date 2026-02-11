from abc import ABC, abstractmethod

from miam.infra.db.base import Recipe


class WordExporterPort(ABC):
    @abstractmethod
    def export(self, recipes: list[Recipe], output_path: str) -> None:
        pass

    @abstractmethod
    def to_bytes(self, recipes: list[Recipe]) -> bytes:
        pass


class MarkdownExporterPort(ABC):
    @abstractmethod
    def to_string(self, recipes: list[Recipe]) -> str:
        pass

    @abstractmethod
    def to_markdown(self, recipes: list[Recipe], output_file: str) -> None:
        pass
