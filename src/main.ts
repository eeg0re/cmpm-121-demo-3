// import important things here
import leaflet from "leaflet";
import "./style.css";
import "leaflet/dist/leaflet.css";
import "./leafletWorkaround.ts";
import luck from "./luck.ts";

interface Cell {
  readonly i: number;
  readonly j: number;
}

const STARTING_POS = leaflet.latLng(36.98949379578401, -122.06277128548504);
const PLAYER_POS = STARTING_POS;

const ZOOM_LVL: number = 19;
const CELL_SIZE: number = 0.0001; // number of degrees in a cell
const CACHE_SPAWN_PROB: number = 0.1; // probability of a cache spawning in a cell
const NEIGHBORHOOD_SIZE: number = 8;

const map: leaflet.Map = leaflet.map("map", { // create our map starting at Oakes Classroom
  center: PLAYER_POS,
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

function SpawnCache(i: number, j: number) {
  const origin = PLAYER_POS;
  const bounds = leaflet.latLngBounds([
    [origin.lat + i * CELL_SIZE, origin.lng + j * CELL_SIZE],
    [origin.lat + (i + 1) * CELL_SIZE, origin.lng + (j + 1) * CELL_SIZE],
  ]);

  // temporarily create a rectangle to represent each cache
  const rect = leaflet.rectangle(bounds);
  rect.addTo(map);

  // interactions for the cache
  rect.bindPopup(() => {
    let numCoins = Math.floor(luck([i, j, "initialValue"].toString()) * 10);
    const popupDiv = document.createElement("div");

    // popup has a description and 2 buttons, one to withdraw and one to deposit coins
    popupDiv.innerHTML = `
            <div>This is cache "${i},${j}". It has <span id="value">${numCoins}</span> coins.</div>
            <button id="withdraw">Withdraw</button>
            <button id="deposit">Deposit</button>`;

    // add event listeners for each button!
    popupDiv.querySelector<HTMLButtonElement>("#withdraw")!.addEventListener(
      "click",
      () => {
        if (numCoins > 0) {
          numCoins--;
          playerCoins++;
          inventory.innerHTML = `Coins: ${playerCoins}`;
          popupDiv.querySelector<HTMLSpanElement>("#value")!.innerHTML =
            numCoins.toString();
        }
      },
    );

    popupDiv.querySelector<HTMLButtonElement>("#deposit")!.addEventListener(
      "click",
      () => {
        if (playerCoins > 0) {
          playerCoins--;
          numCoins++;
          inventory.innerHTML = `Coins: ${playerCoins}`;
          popupDiv.querySelector<HTMLSpanElement>("#value")!.innerHTML =
            numCoins.toString();
        }
      },
    );

    return popupDiv;
  });
}

function SpawnInNeighborhood(neighborhoodSize: number) {
  // function for spawning caches in a player's immediate surroundings
  // this function will likely change later on
  // for(let i = -neighborhoodSize; i < neighborhoodSize; i++){
  //   for(let j = -neighborhoodSize; j < neighborhoodSize; j++){
  //     if(luck([i,j].toString()) < CACHE_SPAWN_PROB){
  //       SpawnCache(i, j);
  //     }
  //   }
  // }
  for (let i = neighborhoodSize; i > -neighborhoodSize; i--) {
    for (let j = neighborhoodSize; j > -neighborhoodSize; j--) {
      if (luck([i, j].toString()) < CACHE_SPAWN_PROB) {
        SpawnCache(i, j);
      }
    }
  }
}

const APP_NAME = "GeoCoin Collector";
const app = document.querySelector<HTMLDivElement>("#app")!;
document.title = APP_NAME;
app.innerHTML = APP_NAME;

const header = document.createElement("h1");
app.append(header);

const player = leaflet.marker(STARTING_POS);
player.bindTooltip("You are here");
player.addTo(map);

let playerCoins: number = 0;
const inventory = document.querySelector<HTMLDivElement>("#inventory")!;
inventory.innerHTML = `Coins: ${playerCoins}`;

SpawnInNeighborhood(NEIGHBORHOOD_SIZE);
