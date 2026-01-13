from databases.database import Base
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Text, DateTime, Float, JSON, Enum, func
from enum import Enum as PyEnum
from sqlalchemy.orm import relationship, sessionmaker
from datetime import datetime

class EnumJaringan(PyEnum):
    IA = 'IA'
    II = 'II'
    
class EnumStatusStasiun(PyEnum):
    aktif = 'aktif'
    nonaktif = 'nonaktif'
    
class EnumPrioritas(PyEnum):
    P1 = 'P1'
    P2 = 'P2'
    P3 = 'P3'

class EnumAccelerometer(PyEnum):
    installed = 'installed'
    not_installed = 'not_installed'

class EnumTypeShelter(PyEnum):
    bunker = 'bunker'
    posthole = 'posthole'
    surface = 'surface'

class EnumLokasiShelter(PyEnum):
    outside_BMKG_office = 'outside_BMKG_office'
    inside_BMKG_office = 'inside_BMKG_office'

class EnumPenjagaShelter(PyEnum):
    ada = 'ada'
    tidak_ada = 'tidak_ada'

class EnumKondisiShelter(PyEnum):
    baik = 'baik'
    rusak_ringan = 'rusak_ringan'
    rusak_berat = 'rusak_berat'



class StasiunHistory(Base):
    __tablename__ = 'stasiun_history'

    history_id = Column(Integer, primary_key=True, index=True)
    stasiun_id = Column(Integer, ForeignKey("stasiun.stasiun_id", ondelete="SET NULL") )
    status = Column(Boolean, default=False)
    channel = Column(String(10))
    sensor_name = Column(Text)
    digitizer_name = Column(Text)
    total_gain = Column(Integer)
    input_unit = Column(String(10))
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    latitude = Column(Float)
    longitude = Column(Float)
    elevation = Column(Float)
    sampling_rate = Column(Float)
    paz = Column(JSON)
    response_path = Column(Text)
    created_at = Column(DateTime, default=datetime.now)

    
    
    
class Stasiun(Base):
    __tablename__ = 'stasiun'

    stasiun_id = Column(Integer, primary_key=True, index=True)
    net = Column(String(2))
    kode_stasiun = Column(String(8))
    lintang = Column(Float)
    bujur = Column(Float)
    elevasi = Column(Float)
    lokasi = Column(String(255))
    provinsi_id = Column(Integer, ForeignKey("provinsi.provinsi_id", ondelete="SET NULL"))
    upt_id = Column(Integer, ForeignKey("upt.upt_id", ondelete="SET NULL"))
    status = Column(String(10))
    jaringan_id = Column(Integer, ForeignKey("jaringan.jaringan_id", ondelete="SET NULL"))
    prioritas = Column(String(5))
    keterangan = Column(Text)
    
    accelerometer = Column(String(20))
    digitizer_komunikasi = Column(String(255))
    tipe_shelter = Column(String(10))
    lokasi_shelter = Column(String(30))
    penjaga_shelter = Column(String(10))
    kondisi_shelter = Column(Text)
    assets_shelter = Column(Text)
    access_shelter = Column(Text)
    photo_shelter = Column(Text)
    penggantian_terakhir_alat = Column(DateTime)
    updated_at = Column(DateTime)
    
    

    
    stasiun_history = relationship("StasiunHistory", backref="stasiun")
    availability = relationship("Availability", backref="stasiun")


class Provinsi(Base):
    __tablename__ = 'provinsi'

    provinsi_id = Column(Integer, primary_key=True, index=True)
    nama_provinsi = Column(String(32))
    stasiun = relationship("Stasiun", backref="provinsi")
    
class UPT(Base):
    __tablename__ = 'upt'

    upt_id = Column(Integer, primary_key=True, index=True)
    nama_upt = Column(String(32))
    

    stasiun = relationship("Stasiun", backref="upt")
    
    
class Jaringan(Base):
    __tablename__ = 'jaringan'

    jaringan_id = Column(Integer, primary_key=True, index=True)
    nama_jaringan = Column(Text)
    
    stasiun = relationship("Stasiun", backref="jaringan")
    
        
class Availability(Base):
    __tablename__ = 'availability'

    availability_id = Column(Integer, primary_key=True, index=True)
    stasiun_id = Column(Integer, ForeignKey("stasiun.stasiun_id", ondelete= "SET NULL"))
    tanggal = Column(DateTime)
    nilai_availability = Column(Integer)
    

    
class LatencyHistory(Base):
    __tablename__ = 'latency_history'

    id = Column(Integer, primary_key=True, index=True)
    sta = Column(String(10), nullable= False)
    kode_stasiun = Column(String(8))
    ipaddr = Column(String(45))
    net = Column(String(10))
    time_from_api = Column(DateTime)
    latency1 = Column(Integer)
    latency2s = Column(Integer)
    latency3 = Column(Integer)
    latency4 = Column(Integer)
    latency5 = Column(Integer)
    latency6 = Column(Integer)
    ch1 = Column(String(10))
    ch2 = Column(String(10))
    ch3 = Column(String(10))
    ch4 = Column(String(10))
    ch5 = Column(String(10))
    ch6 = Column(String(10))
    location = Column(String(255))
    provin =Column(String(50))
    uptbmkg =Column(String(100))
    latitude = Column(Float)
    longitude = Column(Float)

    recorded_at = Column(DateTime)



    
class MetadataXMLPath(Base):
    __tablename__ = 'metadata_XML_path'

    id = Column(Integer, primary_key=True, index=True)
    path = Column(Text, nullable=False)
    updated_at = Column(DateTime)



# "sta",
#     'Channel', 
#     'Sensor', 
#     "Digitizer", 
#     "final constant",
#     "input unit",
#     "start_date",
#     "end_date",
#     "status",
#     "latitude",
#     "longitude",
#     "elevation",
#     "sampling_rate",
#     "paz"
    
    
# -- Combined Migration File
# -- This file combines all migration scripts into a single file

# -- Create database if not exists
# CREATE DATABASE IF NOT EXISTS stasiun_quality_control;
# USE stasiun_quality_control;

# -- 001_create_reference_tables.sql
# CREATE TABLE `provinsi` (
#   `provinsi_id` integer PRIMARY KEY AUTO_INCREMENT,
#   `nama_provinsi` varchar(32) NOT NULL
# );

# CREATE TABLE `upt` (
#   `upt_id` integer PRIMARY KEY AUTO_INCREMENT,
#   `nama_upt` varchar(255) NOT NULL
# );

# CREATE TABLE `jaringan` (
#   `jaringan_id` integer PRIMARY KEY AUTO_INCREMENT,
#   `nama_jaringan` varchar(255) NOT NULL
# );

# -- 002_create_stasiun_table.sql
# CREATE TABLE `stasiun` (
#   `stasiun_id` integer PRIMARY KEY AUTO_INCREMENT,
#   `net` ENUM ('II', 'IA'),
#   `kode_stasiun` varchar(8) UNIQUE NOT NULL,
#   `lintang` float,
#   `bujur` float,
#   `elevasi` float,
#   `lokasi` varchar(255),
#   `provinsi_id` integer,
#   `upt` integer,
#   `status` ENUM ('aktif', 'nonaktif'),
#   `tahun_instalasi` integer,
#   `jaringan_id` integer,
#   `prioritas` ENUM ('P1', 'P2', 'P3'),
#   `keterangan` text NULL,
#   `accelerometer` ENUM ('installed', 'not_installed'),
#   `digitizer_komunikasi` varchar(255),
#   `tipe_shelter` ENUM ('bunker', 'posthole', 'surface'),
#   `lokasi_shelter` ENUM ('outside_BMKG_office', 'inside_BMKG_office'),
#   `penjaga_shelter` ENUM ('ada', 'tidak_ada'),
#   `kondisi_shelter` ENUM ('baik', 'rusak_ringan', 'rusak_berat'),
#   `penggantian_terakhir_alat` datetime,
#   `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
# );

# -- 003_create_stasiun_history_table.sql
# CREATE TABLE `stasiun_history` (
#   `history_id` integer PRIMARY KEY AUTO_INCREMENT,
#   `stasiun_id` integer,
#   `SHE` float,
#   `SHN` float,
#   `SHZ` float,
#   `data_logger` text,
#   `total_gain` float,
#   `input_unit` varchar(10),
#   `sampling_rate` float,
#   `sensor_type` text,
#   `start_date` datetime,
#   `end_date` datetime,
#   `PAZ` float,
#   `status` boolean DEFAULT true,
#   `created_at` datetime DEFAULT CURRENT_TIMESTAMP
# );

# CREATE TABLE `availability` (
#   `availability_id` integer PRIMARY KEY AUTO_INCREMENT,
#   `stasiun_id` integer,
#   `tanggal` datetime,
#   `nilai_availability` integer
# );

# -- 004_add_foreign_keys.sql
# ALTER TABLE `stasiun`
# ADD CONSTRAINT `fk_stasiun_provinsi`
# FOREIGN KEY (`provinsi_id`) REFERENCES `provinsi` (`provinsi_id`)
# ON DELETE SET NULL ON UPDATE CASCADE;

# ALTER TABLE `stasiun`
# ADD CONSTRAINT `fk_stasiun_upt`
# FOREIGN KEY (`upt`) REFERENCES `upt` (`upt_id`)
# ON DELETE SET NULL ON UPDATE CASCADE;

# ALTER TABLE `stasiun`
# ADD CONSTRAINT `fk_stasiun_jaringan`
# FOREIGN KEY (`jaringan_id`) REFERENCES `jaringan` (`jaringan_id`)
# ON DELETE SET NULL ON UPDATE CASCADE;

# ALTER TABLE `stasiun_history`
# ADD CONSTRAINT `fk_history_stasiun`
# FOREIGN KEY (`stasiun_id`) REFERENCES `stasiun` (`stasiun_id`)
# ON DELETE CASCADE ON UPDATE CASCADE;

# ALTER TABLE `availability`
# ADD CONSTRAINT `fk_availability_stasiun`
# FOREIGN KEY (`stasiun_id`) REFERENCES `stasiun` (`stasiun_id`)
# ON DELETE CASCADE ON UPDATE CASCADE;