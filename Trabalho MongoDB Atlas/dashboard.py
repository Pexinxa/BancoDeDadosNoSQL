import streamlit as st
import folium
import matplotlib.pyplot as plt
import matplotlib.ticker as mticker
from streamlit.components.v1 import html as st_html
from pymongo import MongoClient

st.set_page_config(page_title="Dengue Brasil 2015", page_icon="🦟", layout="wide")
st.title(" Dashboard — Dengue no Brasil (2015)")
st.caption("Fonte: SINAN/DATASUS | Base importada no MongoDB Atlas")

MONGO_URI = "mongodb+srv://user:password@clusterdsm.wnqzyqd.mongodb.net/?appName=ClusterDSM"

@st.cache_resource
def get_collection():
    client = MongoClient(MONGO_URI)
    return client["dengue_db"]["dengue_2015"]

col = get_collection()

@st.cache_data
def buscar_regioes():
    pipeline = [
        {"$group": {
            "_id": "$regiao",
            "total_casos": {"$sum": "$casos_confirmados"},
            "media_casos": {"$avg": "$casos_confirmados"},
        }},
        {"$sort": {"total_casos": -1}}
    ]
    return list(col.aggregate(pipeline))

resultado = buscar_regioes()
regioes   = [r["_id"]          for r in resultado]
totais_d  = {r["_id"]: r["total_casos"] for r in resultado}
medias    = [r["media_casos"]   for r in resultado]

total_br = sum(totais_d.values())
c1, c2, c3 = st.columns(3)
c1.metric("Total no Brasil", f"{total_br:,}")
c2.metric("Região com mais casos", resultado[0]["_id"])
c3.metric("Pico regional", f"{resultado[0]['total_casos']:,}")

st.markdown("---")
st.subheader(" Total de casos por região")

centros = {
    "Norte":        (-3.4653,  -62.2159),
    "Nordeste":     (-8.0476,  -34.8770),
    "Centro-Oeste": (-15.7801, -47.9292),
    "Sudeste":      (-19.9167, -43.9345),
    "Sul":          (-25.4284, -49.2733),
}

mapa1 = folium.Map(location=[-14.2, -51.9], zoom_start=4, tiles="CartoDB positron")
for regiao, (lat, lon) in centros.items():
    total = totais_d.get(regiao, 0)
    folium.CircleMarker(
        location=[lat, lon], radius=15,
        color="#c0392b", fill=True, fill_color="#e74c3c", fill_opacity=0.75,
        tooltip=f"<b>{regiao}</b><br>Total: {total:,} casos",
        popup=folium.Popup(f"<b>{regiao}</b><br>Total: <b>{total:,}</b>", max_width=220)
    ).add_to(mapa1)
    folium.Marker(
        location=[lat, lon],
        icon=folium.DivIcon(
            html=f'<div style="font-size:10px;font-weight:bold;color:#c0392b">{total:,}</div>',
            icon_size=(120, 20), icon_anchor=(0, -10)
        )
    ).add_to(mapa1)
st_html(mapa1._repr_html_(), height=420)

st.markdown("---")
st.subheader(" Média de casos por estado em cada região")

fig, ax = plt.subplots(figsize=(9, 4))
cores = ["#2980b9", "#27ae60", "#e67e22", "#8e44ad", "#c0392b"]
bars = ax.bar(regioes, medias, color=cores, edgecolor="white")
for bar, val in zip(bars, medias):
    ax.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 1500,
            f"{val:,.0f}", ha="center", va="bottom", fontsize=8, fontweight="bold")
ax.set_ylabel("Média de casos confirmados")
ax.yaxis.set_major_formatter(mticker.FuncFormatter(lambda x, _: f"{x:,.0f}"))
ax.spines[["top", "right"]].set_visible(False)
ax.set_ylim(0, max(medias) * 1.2)
plt.tight_layout()
st.pyplot(fig)

st.markdown("---")
st.subheader(" Casos nas principais cidades do Sudeste")

cidades_sudeste = [
    {"cidade": "São Paulo - SP",      "lat": -23.5505, "lon": -46.6333, "casos": 119_876},
    {"cidade": "Rio de Janeiro - RJ", "lat": -22.9068, "lon": -43.1729, "casos": 95_432},
    {"cidade": "Belo Horizonte - MG", "lat": -19.9191, "lon": -43.9386, "casos": 44_231},
    {"cidade": "Campinas - SP",       "lat": -22.9056, "lon": -47.0608, "casos": 31_745},
    {"cidade": "Guarulhos - SP",      "lat": -23.4543, "lon": -46.5333, "casos": 27_890},
    {"cidade": "Ribeirão Preto - SP", "lat": -21.1775, "lon": -47.8103, "casos": 17_654},
    {"cidade": "Sorocaba - SP",       "lat": -23.5015, "lon": -47.4526, "casos": 14_987},
    {"cidade": "Niterói - RJ",        "lat": -22.8833, "lon": -43.1036, "casos": 11_320},
]

mapa2 = folium.Map(location=[-21.5, -44.5], zoom_start=6, tiles="CartoDB positron")
for c in cidades_sudeste:
    raio = 6 + (c["casos"] / 15_000)
    folium.CircleMarker(
        location=[c["lat"], c["lon"]], radius=raio,
        color="#922b21", fill=True, fill_color="#e74c3c", fill_opacity=0.7,
        tooltip=f"<b>{c['cidade']}</b><br>{c['casos']:,} casos",
        popup=folium.Popup(f"<b>{c['cidade']}</b><br>Casos: <b>{c['casos']:,}</b>", max_width=220)
    ).add_to(mapa2)
st_html(mapa2._repr_html_(), height=450)
