import re
from uuid import UUID

from app.core.exceptions.exceptions import ValidationException


class Validator:
    """
    Classe responsável pelas validações reutilizáveis
    da plataforma EduData IA.
    """

    @staticmethod
    def required(value, field_name: str):
        if value is None:
            raise ValidationException(
                f"O campo '{field_name}' é obrigatório."
            )

        if isinstance(value, str) and not value.strip():
            raise ValidationException(
                f"O campo '{field_name}' é obrigatório."
            )

    @staticmethod
    def email(email: str):
        Validator.required(email, "email")

        pattern = r"^[\w\.-]+@[\w\.-]+\.\w+$"

        if not re.match(pattern, email):
            raise ValidationException(
                "E-mail inválido."
            )

    @staticmethod
    def uuid(value: str, field_name: str = "id"):
        try:
            UUID(str(value))
        except Exception:
            raise ValidationException(
                f"{field_name} inválido."
            )

    @staticmethod
    def min_length(
        value: str,
        minimum: int,
        field_name: str,
    ):
        Validator.required(value, field_name)

        if len(value.strip()) < minimum:
            raise ValidationException(
                f"{field_name} deve possuir pelo menos {minimum} caracteres."
            )

    @staticmethod
    def max_length(
        value: str,
        maximum: int,
        field_name: str,
    ):
        Validator.required(value, field_name)

        if len(value.strip()) > maximum:
            raise ValidationException(
                f"{field_name} deve possuir no máximo {maximum} caracteres."
            )

    @staticmethod
    def positive(
        value,
        field_name: str,
    ):
        if value <= 0:
            raise ValidationException(
                f"{field_name} deve ser maior que zero."
            )

    @staticmethod
    def not_empty_list(
        values,
        field_name: str,
    ):
        if not values:
            raise ValidationException(
                f"{field_name} não pode estar vazio."
            )

    @staticmethod
    def one_of(
        value,
        options: list,
        field_name: str,
    ):
        if value not in options:
            raise ValidationException(
                f"{field_name} deve ser um dos seguintes valores: {', '.join(map(str, options))}."
            )