from __future__ import annotations

from pathlib import Path

import pandas as pd


RKI_RAW_URL = (
    "https://raw.githubusercontent.com/robert-koch-institut/"
    "SARS-CoV-2-Infektionen_in_Deutschland/main/"
    "Aktuell_Deutschland_SarsCov2_Infektionen.csv"
)

ROOT_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT_DIR / "data"
INPUT_CSV = DATA_DIR / "Aktuell_Deutschland_SarsCov2_Infektionen.csv"
REFERENCE_CSV = DATA_DIR / "Seasonal Search Rhythms — Summer vs Winter (2018–2022)_individual.csv"
OUTPUT_CSV = DATA_DIR / "COVID_Germany_weekly_2018_2022.csv"

def ensure_input_csv(input_path: Path) -> Path:
    if input_path.exists():
        return input_path

    input_path.parent.mkdir(parents=True, exist_ok=True)
    print("Local RKI CSV missing, downloading fresh copy...")
    df = pd.read_csv(RKI_RAW_URL)
    df.to_csv(input_path, index=False)
    return input_path


def load_weekly_dates(reference_path: Path) -> pd.DatetimeIndex:
    if reference_path.exists():
        ref = pd.read_csv(reference_path, usecols=[0])
        date_col = ref.columns[0]
        dates = pd.to_datetime(ref[date_col], errors="coerce")
        dates = dates.dropna().drop_duplicates().sort_values()
        return pd.DatetimeIndex(dates)

    return pd.date_range("2018-01-07", "2022-12-25", freq="W-SUN")


def build_weekly_series(rki_csv: Path, weekly_dates: pd.DatetimeIndex) -> pd.DataFrame:
    usecols = ["Meldedatum", "AnzahlFall", "AnzahlTodesfall", "AnzahlGenesen"]
    df = pd.read_csv(rki_csv, usecols=usecols)

    df["Meldedatum"] = pd.to_datetime(df["Meldedatum"], errors="coerce")
    df = df.dropna(subset=["Meldedatum"])

    daily = (
        df.groupby("Meldedatum", as_index=True)[["AnzahlFall", "AnzahlTodesfall", "AnzahlGenesen"]]
        .sum()
        .sort_index()
        .rename(
            columns={
                "AnzahlFall": "new_cases",
                "AnzahlTodesfall": "new_deaths",
                "AnzahlGenesen": "new_recovered",
            }
        )
    )

    # Keep negative corrections visible but also provide non-negative weekly sums.
    daily["new_cases_clipped"] = daily["new_cases"].clip(lower=0)
    daily["new_deaths_clipped"] = daily["new_deaths"].clip(lower=0)
    daily["new_recovered_clipped"] = daily["new_recovered"].clip(lower=0)

    full_idx = pd.date_range(
        min(daily.index.min(), weekly_dates.min() - pd.Timedelta(days=7)),
        max(daily.index.max(), weekly_dates.max()),
        freq="D",
    )
    daily = daily.reindex(full_idx, fill_value=0)

    daily["weekly_cases"] = daily["new_cases_clipped"].rolling(7, min_periods=1).sum()
    daily["weekly_deaths"] = daily["new_deaths_clipped"].rolling(7, min_periods=1).sum()
    daily["weekly_recovered"] = daily["new_recovered_clipped"].rolling(7, min_periods=1).sum()

    daily["total_cases"] = daily["new_cases_clipped"].cumsum()
    daily["total_deaths"] = daily["new_deaths_clipped"].cumsum()
    daily["total_recovered"] = daily["new_recovered_clipped"].cumsum()

    out = daily.reindex(weekly_dates, fill_value=0).copy()
    out.index.name = "date"
    out["covid_pressure_index"] = (
        (out["weekly_cases"] / max(1.0, out["weekly_cases"].max())) * 100
    ).round(2)

    out = out[
        [
            "weekly_cases",
            "weekly_deaths",
            "weekly_recovered",
            "total_cases",
            "total_deaths",
            "total_recovered",
            "covid_pressure_index",
        ]
    ].reset_index()

    out.columns = [
        "date",
        "covid_weekly_cases",
        "covid_weekly_deaths",
        "covid_weekly_recovered",
        "covid_total_cases",
        "covid_total_deaths",
        "covid_total_recovered",
        "covid_pressure_index",
    ]

    return out


def main() -> None:
    input_csv = ensure_input_csv(INPUT_CSV)
    weekly_dates = load_weekly_dates(REFERENCE_CSV)
    weekly = build_weekly_series(input_csv, weekly_dates)

    OUTPUT_CSV.parent.mkdir(parents=True, exist_ok=True)
    weekly.to_csv(OUTPUT_CSV, index=False)

    print(f"Wrote {len(weekly)} weekly rows to: {OUTPUT_CSV}")
    print(f"Date range: {weekly['date'].min()} -> {weekly['date'].max()}")


if __name__ == "__main__":
    main()
