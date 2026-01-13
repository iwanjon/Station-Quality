from typing import Optional, List
from datetime import datetime
from enum import Enum
from pydantic import BaseModel

####################################################

class EnumJaringan(str, Enum):
    IA = "IA"
    II = "II"


class EnumStatusStasiun(str, Enum):
    aktif = "aktif"
    nonaktif = "nonaktif"


class EnumPrioritas(str, Enum):
    P1 = "P1"
    P2 = "P2"
    P3 = "P3"


class EnumAccelerometer(str, Enum):
    installed = "installed"
    not_installed = "not_installed"


class EnumTypeShelter(str, Enum):
    bunker = "bunker"
    posthole = "posthole"
    surface = "surface"


class EnumLokasiShelter(str, Enum):
    outside_BMKG_office = "outside_BMKG_office"
    inside_BMKG_office = "inside_BMKG_office"


class EnumPenjagaShelter(str, Enum):
    ada = "ada"
    tidak_ada = "tidak_ada"


class EnumKondisiShelter(str, Enum):
    baik = "baik"
    rusak_ringan = "rusak_ringan"
    rusak_berat = "rusak_berat"


####################################################

class ProvinsiBase(BaseModel):
    nama_provinsi: str


class ProvinsiRead(ProvinsiBase):
    provinsi_id: int

    class Config:
        orm_mode = True

####################################################

class UPTBase(BaseModel):
    nama_upt: str


class UPTRead(UPTBase):
    upt_id: int

    class Config:
        orm_mode = True


####################################################

class JaringanBase(BaseModel):
    nama_jaringan: str


class JaringanRead(JaringanBase):
    jaringan_id: int

    class Config:
        orm_mode = True


####################################################

class StasiunHistoryBase(BaseModel):
    status: Optional[bool] = False
    channel: Optional[str]
    sensor_name: Optional[str]
    digitizer_name: Optional[str]
    total_gain: Optional[int]
    input_unit: Optional[str]
    start_date: Optional[datetime]
    end_date: Optional[datetime]
    latitude: Optional[float]
    longitude: Optional[float]
    elevation: Optional[float]
    sampling_rate: Optional[float]
    paz: Optional[dict]
    response_path: Optional[str]


class StasiunHistoryCreate(StasiunHistoryBase):
    stasiun_id: int


class StasiunHistoryRead(StasiunHistoryBase):
    history_id: int
    stasiun_id: Optional[int]
    created_at: datetime

    class Config:
        orm_mode = True


####################################################

class AvailabilityBase(BaseModel):
    tanggal: Optional[datetime]
    nilai_availability: Optional[int]


class AvailabilityCreate(AvailabilityBase):
    stasiun_id: int


class AvailabilityRead(AvailabilityBase):
    availability_id: int
    stasiun_id: Optional[int]

    class Config:
        orm_mode = True

####################################################

class StasiunBase(BaseModel):
    net: Optional[EnumJaringan]
    kode_stasiun: str
    lintang: Optional[float]
    bujur: Optional[float]
    elevasi: Optional[float]
    lokasi: Optional[str]

    provinsi_id: Optional[int]
    upt_id: Optional[int]
    jaringan_id: Optional[int]

    status: Optional[EnumStatusStasiun]
    prioritas: Optional[EnumPrioritas]
    keterangan: Optional[str]

    accelerometer: Optional[EnumAccelerometer]
    digitizer_komunikasi: Optional[str]
    tipe_shelter: Optional[EnumTypeShelter]
    lokasi_shelter: Optional[EnumLokasiShelter]
    penjaga_shelter: Optional[EnumPenjagaShelter]
    kondisi_shelter: Optional[EnumKondisiShelter]

    assets_shelter: Optional[str]
    access_shelter: Optional[str]
    photo_shelter: Optional[str]

    penggantian_terakhir_alat: Optional[datetime]


####################################################


class MetadataXMLPathBase(BaseModel):
    id: int
    path: str
    updated_at: Optional[datetime]

####################################################
