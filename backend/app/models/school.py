from datetime import datetime
from typing import Optional
from uuid import uuid4

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class SchoolRegistry(Base):
    """
    Representa a base oficial nacional de escolas.

    Esta tabela armazena os dados oficiais importados da base INEP
    e será utilizada por todos os produtos da EduData IA.
    """

    __tablename__ = "school_registry"

    id: Mapped[str] = mapped_column(
        String,
        primary_key=True,
        default=lambda: str(uuid4())
    )

    inep_code: Mapped[str] = mapped_column(
        String(20),
        unique=True,
        nullable=False,
        index=True
    )

    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        index=True
    )

    uf: Mapped[Optional[str]] = mapped_column(String(2), nullable=True, index=True)
    municipality: Mapped[Optional[str]] = mapped_column(String(150), nullable=True, index=True)
    location: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    differentiated_location: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)

    administrative_category: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    administrative_dependency: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    private_school_category: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)

    address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    public_agreement: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    education_council_regulation: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)

    school_size: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    offered_education_stages: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    other_educational_offers: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    attendance_restriction: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)

    latitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    source: Mapped[str] = mapped_column(
        String(50),
        default="INEP",
        nullable=False
    )

    active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )


class ManualSchool(Base):
    """
    Representa escolas cadastradas manualmente quando não encontradas
    na base oficial INEP.

    Toda escola manual nasce pendente de validação.
    """

    __tablename__ = "manual_schools"

    id: Mapped[str] = mapped_column(
        String,
        primary_key=True,
        default=lambda: str(uuid4())
    )

    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        index=True
    )

    uf: Mapped[Optional[str]] = mapped_column(String(2), nullable=True, index=True)
    municipality: Mapped[Optional[str]] = mapped_column(String(150), nullable=True, index=True)
    location: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    administrative_dependency: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)

    latitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    source: Mapped[str] = mapped_column(
        String(50),
        default="MANUAL",
        nullable=False
    )

    review_status: Mapped[str] = mapped_column(
        String(50),
        default="pending",
        nullable=False,
        index=True
    )

    verified: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False
    )

    created_by_user_id: Mapped[Optional[str]] = mapped_column(
        String,
        nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )


class OrganizationSchool(Base):
    """
    Representa o vínculo entre uma organização da EduData IA e uma escola.

    A escola vinculada pode vir da base oficial INEP ou de cadastro manual.
    """

    __tablename__ = "organization_schools"

    id: Mapped[str] = mapped_column(
        String,
        primary_key=True,
        default=lambda: str(uuid4())
    )

    organization_id: Mapped[str] = mapped_column(
        String,
        nullable=False,
        index=True
    )

    school_registry_id: Mapped[Optional[str]] = mapped_column(
        String,
        ForeignKey("school_registry.id"),
        nullable=True,
        index=True
    )

    manual_school_id: Mapped[Optional[str]] = mapped_column(
        String,
        ForeignKey("manual_schools.id"),
        nullable=True,
        index=True
    )

    role: Mapped[str] = mapped_column(
        String(50),
        default="main",
        nullable=False
    )

    active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )

    official_school = relationship("SchoolRegistry")
    manual_school = relationship("ManualSchool")
