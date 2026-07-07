from pytrends.request import TrendReq
import plotly.graph_objects as go

# --- Fetch Data ---
pytrends = TrendReq(hl="en-US", tz=360)

# Summer keywords
summer_keywords = ["sunscreen", "ice cream"]
pytrends.build_payload(summer_keywords, timeframe="2018-01-01 2022-12-31", geo="")
df_summer = pytrends.interest_over_time()

# Winter keywords (fetched separately to avoid 5-keyword API limit issues)
winter_keywords = ["hot chocolate", "christmas"]
pytrends.build_payload(winter_keywords, timeframe="2018-01-01 2022-12-31", geo="")
df_winter = pytrends.interest_over_time()

# Drop partial flag
for df in [df_summer, df_winter]:
    if "isPartial" in df.columns:
        df.drop(columns=["isPartial"], inplace=True)

# --- Plot ---
colors = {
    "sunscreen": "#F4A261",
    "ice cream": "#48CAE4",
    "hot chocolate": "#8B5E3C",
    "christmas": "#D62828",
}

fig = go.Figure()

for keyword in summer_keywords:
    fig.add_trace(
        go.Scatter(
            x=df_summer.index,
            y=df_summer[keyword],
            name=keyword.title(),
            mode="lines",
            line=dict(width=2.5, color=colors[keyword]),
            hovertemplate="%{x|%b %Y}<br>Interest: %{y}<extra>"
            + keyword.title()
            + "</extra>",
        )
    )

for keyword in winter_keywords:
    fig.add_trace(
        go.Scatter(
            x=df_winter.index,
            y=df_winter[keyword],
            name=keyword.title(),
            mode="lines",
            line=dict(width=2.5, color=colors[keyword]),
            hovertemplate="%{x|%b %Y}<br>Interest: %{y}<extra>"
            + keyword.title()
            + "</extra>",
        )
    )

# Shade summer months (approx June–August) for one year as legend example
fig.add_vrect(
    x0="2020-06-01",
    x1="2020-08-31",
    fillcolor="orange",
    opacity=0.05,
    layer="below",
    line_width=0,
    annotation_text="Summer",
    annotation_position="top left",
    annotation_font_size=9,
    annotation_font_color="orange",
)
fig.add_vrect(
    x0="2020-11-15",
    x1="2021-01-05",
    fillcolor="blue",
    opacity=0.05,
    layer="below",
    line_width=0,
    annotation_text="Winter",
    annotation_position="top left",
    annotation_font_size=9,
    annotation_font_color="steelblue",
)

fig.update_layout(
    title=dict(
        text="Seasonal Search Rhythms — Summer vs Winter (2018–2024)",
        font=dict(size=20),
    ),
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
# fig.write_html("trend_seasonal.html")  # Uncomment to save as file
