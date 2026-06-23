import sys
import json
import time
import argparse
import urllib.request
import urllib.error

DATASETS = [
    {"id": "yix6-7yeh", "name": "Indicadores del mercado laboral"},
    {"id": "2c7k-9iru", "name": "Vacantes de empleo"},
    {"id": "khhm-wccm", "name": "Demanda laboral por sector"},
    {"id": "xs69-evan", "name": "Oferta de empleo"},
    {"id": "2v94-3ypi", "name": "Perfiles ocupacionales"},
    {"id": "canv-4tj3", "name": "Estadísticas de empleo"},
    {"id": "daed-z4fw", "name": "Tendencias de contratación"},
    {"id": "tgvn-r2n9", "name": "Empleabilidad regional"},
    {"id": "fvq4-wwtz", "name": "Sectores económicos"},
    {"id": "8pqf-rmzr", "name": "Formación para el empleo"},
    {"id": "28vu-5tx7", "name": "Registro general de referencia"},
]

BASE_URL = "https://www.datos.gov.co/resource/{id}.json?$limit={limit}"
TIMEOUT = 20


def fetch_dataset(dataset_id: str, limit: int):
    """Consulta un dataset vía la SODA API (GET simple, sin llaves)."""
    url = BASE_URL.format(id=dataset_id, limit=limit)
    req = urllib.request.Request(url, headers={"User-Agent": "GeoPly/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
            raw = resp.read()
            return json.loads(raw.decode("utf-8"))
    except urllib.error.HTTPError as e:
        print(f"  ⚠ HTTP {e.code} para {dataset_id}")
    except urllib.error.URLError as e:
        print(f"  ⚠ Error de red para {dataset_id}: {e.reason}")
    except Exception as e:  # noqa: BLE001
        print(f"  ⚠ Error inesperado para {dataset_id}: {e}")
    return None


def summarize_fields(records):
    """Devuelve un resumen de campos: nombre -> tipo de ejemplo + ejemplo de valor."""
    fields = {}
    for record in records:
        for key, value in record.items():
            if key not in fields:
                sample = value
                if isinstance(sample, (dict, list)):
                    sample = json.dumps(sample, ensure_ascii=False)[:60]
                fields[key] = {
                    "tipo": type(value).__name__,
                    "ejemplo": str(sample)[:60],
                }
    return fields


def main():
    parser = argparse.ArgumentParser(description="Inspecciona/cachea los datasets de empleo de datos.gov.co")
    parser.add_argument("--limit", type=int, default=20, help="Registros a consultar por dataset (default: 20)")
    parser.add_argument("--schema", action="store_true", help="Solo muestra el esquema de campos, no guarda caché")
    parser.add_argument("--out", default="empleo_cache.json", help="Archivo de salida para la caché")
    args = parser.parse_args()

    cache = {}
    print(f"Consultando {len(DATASETS)} conjuntos de datos (limit={args.limit})…\n")

    for ds in DATASETS:
        print(f"[{ds['id']}] {ds['name']}")
        records = fetch_dataset(ds["id"], args.limit)

        if records is None:
            print("  → No disponible.\n")
            cache[ds["id"]] = []
            continue

        if not isinstance(records, list) or not records:
            print("  → Conjunto vacío.\n")
            cache[ds["id"]] = []
            continue

        print(f"  → {len(records)} registros recibidos")
        fields = summarize_fields(records)
        print("  → Campos detectados:")
        for fname, info in fields.items():
            print(f"      - {fname}: {info['tipo']}  (ej: {info['ejemplo']})")
        print()

        cache[ds["id"]] = records
        time.sleep(0.3)

    if not args.schema:
        with open(args.out, "w", encoding="utf-8") as f:
            json.dump(cache, f, ensure_ascii=False, indent=2)
        print(f"✔ Caché guardada en: {args.out}")

    print("\nListo. Revisa los campos detectados arriba para:")
    print("  1. Ajustar los nombres en DATASETS (dashboard.js) según el contenido real.")
    print("  2. Si un dataset usa nombres de columnas de geolocalización distintos")
    print("     (ej. 'cod_dpto', 'nombre_depto'), agrégalos a las listas")
    print("     CITY_KEYS / DEPT_KEYS / LAT_KEYS / LNG_KEYS en geo-data.js.")


if __name__ == "__main__":
    sys.exit(main()) 