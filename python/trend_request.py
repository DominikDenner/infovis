from pytrends.request import TrendReq
import plotly.graph_objects as go
import plotly.express as px
import pandas as pd
import time
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parents[1] / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)


def visualize_trends(df, keywords, title):
    palette = px.colors.qualitative.Plotly
    colors = {kw: palette[i % len(palette)] for i, kw in enumerate(keywords)}

    fig = go.Figure()

    for keyword in keywords:
        fig.add_trace(
            go.Scatter(
                x=df.index,
                y=df[keyword],
                name=keyword.title(),
                mode="lines",
                line=dict(width=2.5, color=colors[keyword]),
                hovertemplate="%{x|%b %Y}<br>Interest: %{y}<extra>" + keyword.title() + "</extra>",
            )
        )

    # --- COVID line ---
    covid_x = pd.Timestamp("2020-03-11").timestamp() * 1000
    fig.add_vline(
        x=covid_x,
        line_dash="dash",
        line_color="red",
        line_width=1.5,
        annotation_text="WHO declares pandemic",
    )

    # --- YEAR LINES (NEW) ---
    start_year = df.index.min().year
    end_year = df.index.max().year

    for year in range(start_year, end_year + 1):
        fig.add_vline(
            x=pd.Timestamp(f"{year}-01-01"),
            line_dash="dot",
            line_color="lightgray",
            line_width=1,
        )

    fig.update_layout(
        title=dict(text=title, font=dict(size=20)),
        xaxis_title="Date",
        yaxis_title="Search Interest (0–100)",
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
        hovermode="x unified",
        plot_bgcolor="white",
        paper_bgcolor="white",
        xaxis=dict(showgrid=True, gridcolor="#eeeeee"),
        yaxis=dict(showgrid=True, gridcolor="#eeeeee"),
        margin=dict(t=80, b=60),
    )

    fig.show()


def fetch_and_plot_trends(keywords, title, timeframe="2018-01-01 2022-12-31", visualize=True):
    """
    Fetches Google Trends data for the specified keywords and plots it using Plotly.
    Keywords are called together -> competition is relative to strongest keyword
    Parameters:
    - keywords: List of search terms to fetch trends for. IMPORTANT: Keep this list to 5 or fewer keywords to avoid API limitations.
    - title: Title of the plot.
    - timeframe: Time range for the trends data (default is 2018–2022).

    """
    # --- Fetch Data ---
    pytrends = TrendReq(hl="en-US", tz=360)
    pytrends.build_payload(keywords, timeframe=timeframe, geo="")
    df = pytrends.interest_over_time()
    if "isPartial" in df.columns:
        df = df.drop(columns=["isPartial"])

    """ df = df / df.max()
    df = df.rolling(4, center=True).mean() """

    df.to_csv(DATA_DIR / f"{title}_competition.csv")  # Save raw data for reference

    if visualize:
        visualize_trends(df, keywords, title)


def fetch_trends_individually(keywords, title, timeframe="2018-01-01 2022-12-31", visualize=True, sleep_time=8):
    """
    Fetch Google Trends data keyword-by-keyword to avoid normalization distortion
    and rate limits. Returns a merged DataFrame.
    """

    pytrends = TrendReq(hl="en-US", tz=360)

    all_data = {}

    for kw in keywords:
        for attempt in range(3):  # retry up to 3 times
            try:
                print(f"Fetching: {kw} (attempt {attempt + 1})")
                pytrends.build_payload([kw], timeframe=timeframe, geo="")
                df = pytrends.interest_over_time()
                if "isPartial" in df.columns:
                    df = df.drop(columns=["isPartial"])
                all_data[kw] = df[kw]
                time.sleep(sleep_time)
                break  # success, move to next keyword
            except Exception as e:
                print(f"Failed for {kw}: {e}")
                if attempt < 2:
                    wait = sleep_time * (attempt + 2)  # back off: 16s, 24s
                    print(f"Waiting {wait}s before retry...")
                    time.sleep(wait)

    result_df = pd.DataFrame(all_data)
    result_df = result_df.sort_index()
    result_df.to_csv(DATA_DIR / f"{title}_individual.csv")

    if visualize and not result_df.empty:
        # only visualize keywords that were actually fetched
        fetched_keywords = [k for k in keywords if k in result_df.columns]
        visualize_trends(result_df, fetched_keywords, title + " (Individual Fetch)")


requests = {
    "mental": {
        "title": "mental",
        "keywords": ["anxiety", "depression", "loneliness", "therapy", "burnout"],
    },
    "work": {
        "title": "work",
        "keywords": ["remote work", "work from home", "office"],
    },
    "resolutions": {
        "title": "resolutions",
        "keywords": ["diet", "gym", "workout", "weight loss"],
    },
    "shopping": {
        "title": "shopping",
        "keywords": [
            "online shopping",
            "amazon",
            "delivery",
            "supermarket",
            "toilet paper",
        ],
    },
    "home": {
        "title": "home",
        "keywords": [
            "sourdough bread",
            "home workout",
            "gardening",
            "cooking recipes",
            "ikea",
        ],
    },
    "travel": {
        "title": "travel",
        "keywords": [
            "flights",
            "vacation",
            "hotel",
            "travel restrictions",
            "staycation",
            "japan",
        ],
    },
    "work_economy": {
        "title": "work_economy",
        "keywords": [
            "unemployment",
            "job loss",
            "side hustle",
            "freelance",
            "stimulus",
        ],
    },
    "entertainment": {
        "title": "entertainment",
        "keywords": [
            "netflix",
            "twitch",
            # "animal crossing",
            "puzzle",
            # "board games",
            "spotify",
        ],
    },
    "seasonal": {
        "title": "seasonal",
        "keywords": ["sunscreen", "ice cream", "hot chocolate", "christmas"],
    },
}

current_request = "resolutions"  # Change this key to plot different trends
current_keywords = requests[current_request]["keywords"]
current_title = requests[current_request]["title"]

# fetch_and_plot_trends(current_keywords, current_title, visualize=True)
fetch_trends_individually(current_keywords, current_title, visualize=True)
