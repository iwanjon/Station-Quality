#!/usr/bin/env python3
"""
Script untuk mengkonversi kode_stasiun di JSON menjadi stasiun_id (foreign key)
Berdasarkan mapping dari database stasiun.
"""

import json
import sys
from pathlib import Path

# Mapping kode_stasiun ke stasiun_id
STATION_MAPPING = {
    'AAFM': 1,
    'AAI': 2,
    'AAII': 3,
    'ABJI': 4,
    'ABSM': 5,
    'ACBM': 6,
    'ACJM': 7,
    'ALKI': 8,
    'ALTI': 9,
    'AMPM': 10,
    'ANAPI': 11,
    'APSI': 12,
    'APSSI': 13,
    'ARKPI': 14,
    'ARMI': 15,
    'ARPI': 16,
    'ARSKI': 17,
    'ASTTI': 18,
    'ATKTI': 19,
    'ATNI': 20,
    'BAJI': 21,
    'BAKI': 22,
    'BAPJI': 23,
    'BASAI': 24,
    'BASI': 25,
    'BATI': 26,
    'BATPI': 27,
    'BBBCM': 28,
    'BBCI': 29,
    'BBCM': 30,
    'BBJI': 31,
    'BBJM': 32,
    'BBKI': 510,
    'BBLSI': 33,
    'BBSI': 34,
    'BDBI': 35,
    'BDCM': 36,
    'BDMUI': 37,
    'BESI': 38,
    'BESM': 39,
    'BGASI': 40,
    'BGCI': 41,
    'BGCM': 42,
    'BHCM': 43,
    'BKASI': 44,
    'BKB': 45,
    'BKJI': 46,
    'BKNI': 47,
    'BKSI': 48,
    'BLCM': 49,
    'BLJI': 50,
    'BLSI': 511,
    'BLSM': 51,
    'BMASI': 534,
    'BMBNG': 52,
    'BMSI': 53,
    'BNDI': 54,
    'BNSI': 55,
    'BNTI': 56,
    'BOJI': 57,
    'BOSM': 58,
    'BPMJM': 59,
    'BPSM': 60,
    'BSI': 61,
    'BSMI': 62,
    'BSSI': 63,
    'BTCM': 64,
    'BTJI': 65,
    'BTSPI': 66,
    'BUBSI': 67,
    'BUJI': 68,
    'BUKI': 69,
    'BUMSI': 70,
    'BUSI': 71,
    'BWJI': 72,
    'BYJI': 73,
    'BYLI': 74,
    'CASI': 75,
    'CBJI': 76,
    'CBJM': 77,
    'CCJM': 78,
    'CGJI': 79,
    'CIJI': 80,
    'CIJM': 81,
    'CIKJI': 82,
    'CILJI': 83,
    'CMJI': 84,
    'CNJI': 85,
    'CSBJI': 86,
    'CSJI': 87,
    'CSJM': 88,
    'CTJI': 89,
    'CWJM': 90,
    'DBJI': 91,
    'DBKI': 92,
    'DBNFM': 93,
    'DBNI': 512,
    'DDSI': 94,
    'DNP': 95,
    'DOCM': 96,
    'DSRI': 513,
    'DYPI': 97,
    'EDFI': 98,
    'EDMPI': 99,
    'EGSI': 100,
    'ELMPI': 101,
    'ERPI': 102,
    'ESNI': 103,
    'FAKI': 104,
    'FKMPM': 105,
    'FKSPI': 106,
    'GARPI': 107,
    'GBJI': 108,
    'GEBBI': 109,
    'GEJI': 110,
    'GENI': 111,
    'GESM': 112,
    'GGJM': 113,
    'GHMI': 114,
    'GKJM': 115,
    'GLMI': 514,
    'GMJI': 116,
    'GPSM': 117,
    'GRJI': 118,
    'GSI': 119,
    'GTJI': 120,
    'GTOI': 121,
    'GTSI': 122,
    'GUJM': 123,
    'HINSI': 124,
    'IATSM': 125,
    'IBTI': 126,
    'IGBI': 127,
    'IHMI': 128,
    'IHRSI': 129,
    'IWPI': 130,
    'JAASI': 131,
    'JAGI': 132,
    'JASI': 133,
    'JAY': 134,
    'JBJI': 135,
    'JBJM': 136,
    'JCJI': 137,
    'JHMI': 138,
    'JMBI': 508,
    'JMSI': 139,
    'JPJI': 140,
    'JPSI': 141,
    'JSBFM': 142,
    'JSRJI': 536,
    'JTJM': 143,
    'JWJM': 144,
    'KABKI': 145,
    'KAKKI': 146,
    'KAPI': 507,
    'KARPI': 147,
    'KASAI': 148,
    'KASI': 515,
    'KBBI': 149,
    'KBJM': 150,
    'KBKI': 151,
    'KBSSI': 152,
    'KCSI': 516,
    'KDI': 153,
    'KGCM': 154,
    'KHK': 155,
    'KHSSI': 156,
    'KIMPI': 157,
    'KJCM': 158,
    'KJPJI': 554,
    'KKJM': 159,
    'KKKI': 160,
    'KKKKI': 161,
    'KKMI': 162,
    'KKSI': 163,
    'KKTKI': 164,
    'KLI': 165,
    'KLJI': 166,
    'KLNI': 167,
    'KLSI': 168,
    'KLSM': 169,
    'KMBFM': 170,
    'KMMI': 171,
    'KMNI': 172,
    'KMPI': 173,
    'KMSI': 174,
    'KOMFI': 175,
    'KORPI': 176,
    'KPJI': 177,
    'KPJM': 178,
    'KRAI': 179,
    'KRJI': 180,
    'KRMJI': 537,
    'KRSI': 181,
    'KSI': 182,
    'KSPJI': 538,
    'KTMI': 183,
    'KTTI': 184,
    'KUBSI': 185,
    'KUKI': 186,
    'KUSI': 187,
    'KWJI': 188,
    'LAPSI': 539,
    'LASI': 189,
    'LBDSI': 540,
    'LBFI': 190,
    'LBMI': 517,
    'LBNFM': 191,
    'LBTSI': 192,
    'LDSI': 193,
    'LEM': 194,
    'LEMFI': 195,
    'LESM': 196,
    'LHMI': 197,
    'LHSI': 518,
    'LHSM': 198,
    'LISM': 199,
    'LJPI': 200,
    'LKCI': 201,
    'LKSM': 202,
    'LKUCM': 203,
    'LLSI': 204,
    'LLSM': 205,
    'LMJSI': 535,
    'LMNI': 206,
    'LMTI': 207,
    'LOCM': 208,
    'LOMSI': 209,
    'LPCM': 210,
    'LPSM': 211,
    'LRTI': 212,
    'LSCM': 213,
    'LSNI': 214,
    'LTNI': 215,
    'LTNSI': 216,
    'LTSM': 217,
    'LUCM': 218,
    'LUJI': 219,
    'LUWI': 220,
    'LWLI': 519,
    'MABKI': 221,
    'MAKBI': 222,
    'MAKKI': 223,
    'MASFI': 224,
    'MASI': 520,
    'MASM': 225,
    'MASSI': 226,
    'MBBI': 227,
    'MBJI': 228,
    'MBPI': 229,
    'MBRPI': 230,
    'MBSM': 231,
    'MDSI': 232,
    'MGAI': 233,
    'MIBPI': 234,
    'MIPI': 235,
    'MISSI': 236,
    'MKBI': 237,
    'MKJM': 238,
    'MKS': 521,
    'MKSM': 239,
    'MLJI': 240,
    'MLJM': 241,
    'MLMMI': 242,
    'MLSI': 522,
    'MMCI': 243,
    'MMPI': 523,
    'MMRI': 244,
    'MMSI': 245,
    'MNAI': 246,
    'MNI': 247,
    'MNSI': 248,
    'MPSI': 249,
    'MPSM': 250,
    'MRSI': 251,
    'MSAI': 252,
    'MSCM': 253,
    'MSHHI': 254,
    'MTAI': 255,
    'MTCM': 256,
    'MTJPI': 257,
    'MTKI': 258,
    'MTMPI': 259,
    'MTMTI': 260,
    'MTSI': 261,
    'MTSM': 262,
    'MUMUI': 263,
    'MUTSI': 264,
    'MWPI': 265,
    'NANFI': 266,
    'NBMI': 267,
    'NBPI': 268,
    'NGJI': 269,
    'NJBM': 270,
    'NJLSI': 541,
    'NKBI': 271,
    'NKKI': 272,
    'NKLSI': 542,
    'NLAI': 524,
    'NSBMM': 273,
    'OBMI': 274,
    'OBMPI': 275,
    'OMBFM': 276,
    'ONSM': 277,
    'PAASI': 278,
    'PABI': 279,
    'PABKI': 280,
    'PAFM': 281,
    'PAKI': 282,
    'PASJI': 283,
    'PASMI': 284,
    'PASSI': 543,
    'PBCI': 285,
    'PBJI': 286,
    'PBKI': 287,
    'PBLI': 288,
    'PBMMI': 289,
    'PBMSI': 290,
    'PBNI': 291,
    'PBSI': 292,
    'PCI': 293,
    'PCJI': 294,
    'PCJM': 295,
    'PDLI': 296,
    'PDSI': 297,
    'PGASI': 544,
    'PGJM': 298,
    'PICM': 299,
    'PKCI': 300,
    'PKJI': 301,
    'PKJM': 302,
    'PKKI': 525,
    'PKSI': 303,
    'PLAI': 304,
    'PLJI': 305,
    'PLSI': 306,
    'PLSM': 307,
    'PMBI': 308,
    'PMCI': 309,
    'PMMI': 310,
    'PMSI': 311,
    'PMTSI': 545,
    'POBSI': 312,
    'POCI': 313,
    'POKJI': 314,
    'PPBI': 526,
    'PPCM': 315,
    'PPI': 316,
    'PPJI': 317,
    'PPLI': 318,
    'PPSI': 319,
    'PPSM': 320,
    'PRJI': 321,
    'PRLJI': 322,
    'PRSI': 323,
    'PSASI': 546,
    'PSI': 324,
    'PSJCM': 325,
    'PSJM': 326,
    'PSLI': 327,
    'PSSI': 328,
    'PSSM': 329,
    'PTJI': 330,
    'PTSM': 331,
    'PUPSI': 332,
    'PWCM': 333,
    'PWJI': 334,
    'PWTMI': 547,
    'RAPI': 527,
    'RASM': 335,
    'RDCM': 336,
    'RGRI': 337,
    'RHRSI': 338,
    'RKCM': 339,
    'RKPI': 340,
    'RLBSI': 548,
    'RLSI': 341,
    'RMSM': 342,
    'RNFM': 343,
    'RONI': 344,
    'ROTTI': 345,
    'RRHRI': 346,
    'RRSI': 347,
    'RSMSI': 549,
    'RSNI': 348,
    'RSSM': 349,
    'RTBI': 350,
    'SAASI': 351,
    'SADLY': 352,
    'SAKJI': 353,
    'SAMKI': 354,
    'SANI': 355,
    'SAPSI': 356,
    'SASI': 357,
    'SASM': 358,
    'SATPI': 359,
    'SAUI': 360,
    'SBBM': 361,
    'SBJI': 362,
    'SBNI': 363,
    'SBSI': 528,
    'SBSM': 364,
    'SBSSI': 365,
    'SCJI': 366,
    'SCJM': 367,
    'SDCI': 368,
    'SDSI': 369,
    'SDSM': 370,
    'SEJI': 371,
    'SEMI': 372,
    'SGKI': 373,
    'SGRJI': 550,
    'SGSI': 374,
    'SICJI': 375,
    'SIJI': 376,
    'SIJM': 377,
    'SIRSI': 378,
    'SISI': 529,
    'SISM': 379,
    'SISMI': 380,
    'SIUMI': 381,
    'SJPM': 382,
    'SKJI': 383,
    'SKPM': 384,
    'SKSI': 385,
    'SKSM': 386,
    'SLBFM': 387,
    'SLSI': 388,
    'SLSM': 389,
    'SMKI': 390,
    'SMPI': 391,
    'SMRI': 392,
    'SMSI': 393,
    'SMSM': 394,
    'SNBI': 395,
    'SNJI': 396,
    'SNSI': 397,
    'SOEI': 398,
    'SOMPI': 399,
    'SPSI': 400,
    'SPSJM': 401,
    'SPSM': 402,
    'SRBI': 403,
    'SRMI': 404,
    'SRPI': 405,
    'SRSI': 406,
    'SSASI': 407,
    'SSJM': 408,
    'SSKI': 409,
    'SSMI': 410,
    'SSSI': 411,
    'SSSM': 412,
    'STKI': 530,
    'STPI': 509,
    'STSI': 413,
    'SUPJI': 414,
    'SUSM': 415,
    'SUSPI': 416,
    'SWCM': 417,
    'SWI': 418,
    'SWJI': 419,
    'SWPM': 420,
    'SYJI': 421,
    'TAGJI': 422,
    'TAMI': 423,
    'TAPSI': 424,
    'TARAI': 425,
    'TASI': 426,
    'TASSI': 427,
    'TBCM': 428,
    'TBJI': 429,
    'TBJKI': 430,
    'TBKI': 431,
    'TBMCM': 432,
    'TBMUI': 433,
    'TDNI': 434,
    'TEBBI': 435,
    'TGCM': 436,
    'TIKSI': 437,
    'TIPSI': 438,
    'TKSM': 439,
    'TLCM': 440,
    'TLE2': 441,
    'TMSI': 442,
    'TMSM': 443,
    'TMTMM': 444,
    'TNGI': 445,
    'TNSJI': 551,
    'TNTI': 446,
    'TOBSI': 447,
    'TOCM': 448,
    'TOJI': 449,
    'TOLI2': 450,
    'TOTSI': 451,
    'TPCI': 452,
    'TPI': 453,
    'TPRI': 454,
    'TPSI': 455,
    'TPTI': 456,
    'TRIYO': 457,
    'TRPI': 458,
    'TRSI': 531,
    'TSBJI': 552,
    'TSI': 459,
    'TSJM': 460,
    'TSNI': 461,
    'TSPI': 462,
    'TTPSI': 463,
    'TTSI': 464,
    'TTSM': 465,
    'TTSMI': 466,
    'TUBJI': 553,
    'TUJI': 467,
    'TWSI': 532,
    'UBSI': 533,
    'UGM': 468,
    'UKCM': 469,
    'ULMSI': 470,
    'ULSM': 471,
    'UMKSI': 472,
    'UMSSI': 473,
    'USFM': 474,
    'USTI': 475,
    'UTSI': 476,
    'UTSM': 477,
    'UTUSI': 478,
    'UWJI': 479,
    'UWNPI': 480,
    'WAMI': 481,
    'WANPI': 482,
    'WBMI': 483,
    'WBNI': 484,
    'WBSI': 485,
    'WEFM': 486,
    'WFTFM': 487,
    'WGJM': 488,
    'WHMI': 489,
    'WKCM': 490,
    'WLFM': 491,
    'WLJI': 492,
    'WLTFM': 493,
    'WMCM': 494,
    'WOJI': 495,
    'WRJI': 496,
    'WSHHI': 497,
    'WSI': 498,
    'WSJM': 499,
    'WSTMM': 500,
    'WTKSI': 501,
    'WUPCM': 502,
    'WWCI': 503,
    'WWPI': 504,
    'YBYPI': 505,
    'YOGI': 506
}

def convert_station_codes_to_ids(json_file_path, output_file_path=None):
    """
    Convert kode_stasiun to stasiun_id in JSON file
    
    Args:
        json_file_path (str): Path to input JSON file
        output_file_path (str): Path to output JSON file (optional)
    """
    
    # Read JSON file
    try:
        with open(json_file_path, 'r', encoding='utf-8') as file:
            content = file.read().strip()
            
        # Check if it's multiple JSON objects (JSONL format)
        if content.count('{') > 1 and not content.startswith('['):
            print("🔍 Detected multiple JSON objects. Converting to array format...")
            # Split by lines and parse each as JSON
            lines = [line.strip() for line in content.split('\n') if line.strip()]
            json_objects = []
            
            for i, line in enumerate(lines):
                try:
                    obj = json.loads(line)
                    json_objects.append(obj)
                except json.JSONDecodeError as line_error:
                    print(f"⚠️  Line {i+1} is not valid JSON: {line}")
                    print(f"   Error: {line_error}")
                    continue
            
            if json_objects:
                data = json_objects
                print(f"✅ Successfully parsed {len(json_objects)} JSON objects")
            else:
                print(f"❌ No valid JSON objects found in file")
                return False
        else:
            # Try to parse as regular JSON
            data = json.loads(content)
            
    except FileNotFoundError:
        print(f"❌ Error: File '{json_file_path}' not found!")
        return False
    except json.JSONDecodeError as e:
        print(f"❌ Error: Invalid JSON format in '{json_file_path}': {e}")
        print(f"📍 Error location: line {e.lineno}, column {e.colno}")
        
        # Try to show the problematic content
        try:
            with open(json_file_path, 'r', encoding='utf-8') as file:
                lines = file.readlines()
                if e.lineno <= len(lines):
                    print(f"📝 Problematic line: {lines[e.lineno-1].strip()}")
        except:
            pass
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False
    
    converted_count = 0
    date_cleaned_count = 0
    not_found_codes = []
    
    def process_item(item):
        """Recursively process JSON items"""
        nonlocal converted_count, date_cleaned_count, not_found_codes
        
        if isinstance(item, dict):
            # Process dictionary
            if 'kode_stasiun' in item and isinstance(item['kode_stasiun'], str):
                # Convert kode_stasiun to stasiun_id
                kode_value = item['kode_stasiun']
                if kode_value in STATION_MAPPING:
                    # Replace kode_stasiun with stasiun_id
                    item['stasiun_id'] = STATION_MAPPING[kode_value]
                    del item['kode_stasiun']  # Remove the original kode_stasiun field
                    converted_count += 1
                    print(f"✅ Converted: {kode_value} → {STATION_MAPPING[kode_value]}")
                else:
                    not_found_codes.append(kode_value)
                    print(f"⚠️  Not found: {kode_value}")
            
            # Process tanggal field to remove time part
            if 'tanggal' in item and isinstance(item['tanggal'], str):
                original_date = item['tanggal']
                # Extract only date part (YYYY-MM-DD) from datetime string
                if ' ' in original_date:  # Check if it contains time part
                    date_part = original_date.split(' ')[0]  # Get only the date part
                    item['tanggal'] = date_part
                    date_cleaned_count += 1
                    print(f"🕐 Date cleaned: {original_date} → {date_part}")
            
            # Recursively process nested objects
            for key, value in item.items():
                process_item(value)
        elif isinstance(item, list):
            # Process list
            for list_item in item:
                process_item(list_item)
    
    # Process the JSON data
    print("🔄 Processing JSON data...")
    print("=" * 50)
    
    process_item(data)
    
    # Summary
    print("=" * 50)
    print(f"📊 Conversion Summary:")
    print(f"   ✅ Successfully converted: {converted_count} codes")
    print(f"   🕐 Dates cleaned: {date_cleaned_count} timestamps")
    print(f"   ⚠️  Not found: {len(not_found_codes)} codes")
    
    if not_found_codes:
        print(f"\n❌ Station codes not found in mapping:")
        for code in set(not_found_codes):  # Remove duplicates
            print(f"   - {code}")
    
    # Save to output file
    if output_file_path is None:
        # Generate output filename
        input_path = Path(json_file_path)
        output_file_path = input_path.parent / f"{input_path.stem}_converted{input_path.suffix}"
    
    try:
        with open(output_file_path, 'w', encoding='utf-8') as file:
            json.dump(data, file, indent=2, ensure_ascii=False)
        print(f"\n💾 Output saved to: {output_file_path}")
        return True
    except Exception as e:
        print(f"❌ Error saving output file: {e}")
        return False

def fix_json_file(file_path, output_path=None):
    """Fix common JSON file issues"""
    if output_path is None:
        path_obj = Path(file_path)
        output_path = path_obj.parent / f"{path_obj.stem}_fixed{path_obj.suffix}"
    
    print(f"🔧 Attempting to fix JSON file...")
    
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.read().strip()
        
        lines = [line.strip() for line in content.split('\n') if line.strip()]
        json_objects = []
        
        for i, line in enumerate(lines):
            try:
                obj = json.loads(line)
                json_objects.append(obj)
                print(f"✅ Line {i+1}: Valid JSON object")
            except json.JSONDecodeError as e:
                print(f"❌ Line {i+1}: Invalid JSON - {e}")
                continue
        
        if json_objects:
            # Save as proper JSON array
            with open(output_path, 'w', encoding='utf-8') as file:
                json.dump(json_objects, file, indent=2, ensure_ascii=False)
            
            print(f"🎉 Fixed! Saved {len(json_objects)} objects to: {output_path}")
            return True
        else:
            print("❌ No valid JSON objects found to fix")
            return False
            
    except Exception as e:
        print(f"❌ Error fixing file: {e}")
        return False

def diagnose_json_file(file_path):
    """Diagnose JSON file issues and provide suggestions"""
    print(f"\n🔍 Diagnosing file: {file_path}")
    print("=" * 50)
    
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.read()
        
        print(f"📊 File size: {len(content)} characters")
        print(f"📏 Number of lines: {len(content.splitlines())}")
        
        # Show first few lines
        lines = content.splitlines()
        print(f"\n📝 First 5 lines:")
        for i, line in enumerate(lines[:5], 1):
            print(f"  {i:2d}: {line}")
        
        if len(lines) > 5:
            print(f"  ... ({len(lines)-5} more lines)")
        
        # Check for common issues
        print(f"\n🔍 Analysis:")
        if content.count('{') != content.count('}'):
            print("  ❌ Mismatched braces { }")
        if content.count('[') != content.count(']'):
            print("  ❌ Mismatched brackets [ ]")
        
        # Check if multiple JSON objects
        json_count = content.count('}\n{') + content.count('} {')
        if json_count > 0:
            print(f"  ⚠️  Detected {json_count+1} separate JSON objects")
            print("     💡 Suggestion: Wrap in array brackets [ ... ] or use JSONL format")
        
        # Try parsing each line
        invalid_lines = []
        for i, line in enumerate(lines, 1):
            line = line.strip()
            if line and not line.startswith('#'):  # Skip empty lines and comments
                try:
                    json.loads(line)
                except json.JSONDecodeError:
                    invalid_lines.append(i)
        
        if invalid_lines:
            print(f"  ❌ Invalid JSON on lines: {invalid_lines}")
        else:
            print("  ✅ All non-empty lines are valid JSON objects")
            
    except Exception as e:
        print(f"❌ Error reading file: {e}")

def main():
    """Main function"""
    if len(sys.argv) < 2:
        print("Usage: python convert_station_codes.py <input_json_file> [output_json_file]")
        print("\nExample:")
        print("  python convert_station_codes.py data.json")
        print("  python convert_station_codes.py data.json converted_data.json")
        print("\nOptions:")
        print("  --diagnose : Only diagnose the JSON file without converting")
        print("  --fix      : Try to fix the JSON file and create a corrected version")
        return
    
    # Check for special flags
    if len(sys.argv) >= 3:
        if sys.argv[2] == '--diagnose':
            diagnose_json_file(sys.argv[1])
            return
        elif sys.argv[2] == '--fix':
            if fix_json_file(sys.argv[1]):
                print("\n🔄 Now you can try converting the fixed file...")
            return
    
    input_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else None
    
    print("🚀 Station Code to ID Converter")
    print("=" * 50)
    print(f"📁 Input file: {input_file}")
    print(f"📁 Output file: {output_file or 'Auto-generated'}")
    print("=" * 50)
    
    success = convert_station_codes_to_ids(input_file, output_file)
    
    if success:
        print("\n🎉 Conversion completed successfully!")
    else:
        print("\n💥 Conversion failed!")

if __name__ == "__main__":
    main()