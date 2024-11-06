// import important things here
import leaflet from "leaflet";
import "./style.css";
import "leaflet/dist/leaflet.css";
import "./leafletWorkaround.ts";
//import luck from "./luck.ts";

const APP_NAME = "GeoCoin Collector";
const app = document.querySelector<HTMLDivElement>("#app")!;
document.title = APP_NAME;
app.innerHTML = APP_NAME;

const header = document.createElement("h1");
app.append(header);

const STARTING_POS = leaflet.latLng(36.98949379578401, -122.06277128548504);

const ZOOM_LVL: number = 19;
//const CELL_SIZE: number = 0.0001;          // number of degrees in a cell

const map: leaflet.Map = leaflet.map("map", { // create our map starting at Oakes Classroom
  center: STARTING_POS,
  zoom: ZOOM_LVL,
  minZoom: ZOOM_LVL,
  maxZoom: ZOOM_LVL,
  zoomControl: false,
  scrollWheelZoom: false,
});

// add the world background to the leaflet map
leaflet.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution:
    '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map);

const player = leaflet.marker(STARTING_POS);
player.bindTooltip("You are here");
player.addTo(map);
