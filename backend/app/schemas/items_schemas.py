from pydantic import BaseModel, Field, validator
from datetime import date
from typing import Optional


class CreateItemRequest(BaseModel):
    """Schema para criar um novo item"""
    etiqueta_rfid: str = Field(..., min_length=1, description="Etiqueta RFID única do item")
    categoria: str = Field(..., min_length=1, description="Categoria do produto")
    marca: str = Field(..., min_length=1, description="Marca do produto")
    descricao: str = Field(..., min_length=1, description="Descrição do produto")
    data_validade: Optional[date] = Field(None, description="Data de validade do item")
    
    @validator('etiqueta_rfid', 'categoria', 'marca', 'descricao')
    def must_not_be_blank(cls, v):
        if not v or not v.strip():
            raise ValueError('O campo não pode estar vazio ou conter apenas espaços')
        return v.strip()


class CreateItemResponse(BaseModel):
    """Schema de resposta após criar um item"""
    id: int
    codigo_produto: int
    etiqueta_rfid: str
    descricao: str
    categoria: str
    marca: str
    data_validade: Optional[date]
    message: str


class ProductDescriptionOption(BaseModel):
    """Schema para opções de descrição de produtos"""
    descricao: str
    categoria: str
    marca: str