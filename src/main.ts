// import important things here
import leaflet from "leaflet";
import "./style.css";
import "leaflet/dist/leaflet.css";
import "./leafletWorkaround.ts";
import luck from "./luck.ts";
import { Board } from "./board.ts";

interface Cell {
  readonly i: number;
  readonly j: number;
}

interface Token {
  readonly i: number;
  readonly j: number;
  readonly num: number;
}

interface Cache {
  readonly cell: Cell;
  cacheTokens: Token[];
  marker: leaflet.Rectangle;
}

//const STARTING_POS = leaflet.latLng(36.98949379578401, -122.06277128548504);
const STARTING_POS = leaflet.latLng(0, 0);
const PLAYER_POS = STARTING_POS;

const ZOOM_LVL: number = 19;
const CELL_SIZE: number = 0.0001; // number of degrees in a cell
const CACHE_SPAWN_PROB: number = 0.1; // probability of a cache spawning in a cell
const NEIGHBORHOOD_SIZE: number = 8;

const playerInventory: Token[] = [];

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

function MakeControls() {
  const controlSection = document.querySelector<HTMLDivElement>("#controls")!;
  const locationButton = document.createElement("button");
  controlSection.append(locationButton);
  locationButton.innerHTML = "🌎";

  const upButton = document.createElement("button");
  controlSection.append(upButton);
  upButton.innerHTML = "⬆️";

  const leftButton = document.createElement("button");
  controlSection.append(leftButton);
  leftButton.innerHTML = "⬅️";

  const rightButton = document.createElement("button");
  controlSection.append(rightButton);
  rightButton.innerHTML = "➡️";

  const downButton = document.createElement("button");
  controlSection.append(downButton);
  downButton.innerHTML = "⬇️";

  const trashButton = document.createElement("button");
  controlSection.append(trashButton);
  trashButton.innerHTML = "🗑️";
}

function MakeCache(i: number, j: number): Cache {
  const bounds = worldBoard.getCellBounds({ i, j });
  const rect = leaflet.rectangle(bounds);
  const cache: Cache = { cell: { i, j }, cacheTokens: [], marker: rect };

  rect.addTo(map);

  rect.bindPopup(() => {
    const numTokens = Math.floor(luck([i, j, "initialValue"].toString()) * 10);

    cache.cacheTokens = MakeTokens({ i, j }, numTokens);
    const tokenStr = TokensToString(cache.cacheTokens);

    const popupDiv = document.createElement("div");

    // popup has a description and 2 buttons, one to withdraw and one to deposit Tokens
    popupDiv.innerHTML = `
            <div>This is cache "${i},${j}". It has <span id="value">${numTokens}</span> Tokens.\n<spand id="tokens">${tokenStr}</span></div>
            <button id="withdraw">Withdraw</button>
            <button id="deposit">Deposit</button>`;

    // add event listeners for each button!
    popupDiv.querySelector<HTMLButtonElement>("#withdraw")!.addEventListener(
      "click",
      () => {
        if (cache.cacheTokens.length > 0) {
          playerTokens++;
          playerInventory.push(cache.cacheTokens.pop()!);
          inventory.innerHTML = `Tokens: ${playerTokens}\n${
            TokensToString(playerInventory)
          }`;
          popupDiv.querySelector<HTMLSpanElement>("#value")!.innerHTML = cache
            .cacheTokens.length.toString();
          popupDiv.querySelector<HTMLSpanElement>("#tokens")!.innerHTML =
            TokensToString(cache.cacheTokens);
        }
      },
    );

    popupDiv.querySelector<HTMLButtonElement>("#deposit")!.addEventListener(
      "click",
      () => {
        if (playerInventory.length > 0) {
          playerTokens--;
          cache.cacheTokens.push(playerInventory.pop()!);
          inventory.innerHTML = `Tokens: ${playerTokens}\n${
            TokensToString(playerInventory)
          }`;
          popupDiv.querySelector<HTMLSpanElement>("#value")!.innerHTML = cache
            .cacheTokens.length.toString();
          popupDiv.querySelector<HTMLSpanElement>("#tokens")!.innerHTML =
            TokensToString(cache.cacheTokens);
        }
      },
    );
    return popupDiv;
  });

  return cache;
}

function MakeTokens(cell: Cell, num: number): Token[] {
  const tokens: Token[] = [];
  for (let k = 0; k < num; k++) {
    tokens.push({ i: cell.i, j: cell.j, num: k + 1 });
  }
  return tokens;
}

function TokenToString(token: Token): string {
  const { i, j, num } = token;
  return `(${i}:${j})#${num}`;
}

function TokensToString(tokens: Token[]): string {
  let tokenStr = "";
  for (const token of tokens) {
    tokenStr += TokenToString(token) + "\n";
  }
  return tokenStr;
}

function SpawnInNeighborhood(neighbors: Cell[]) {
  // function for spawning caches in a player's immediate surroundings
  for (let k = 0; k < neighbors.length; k++) {
    const { i, j } = neighbors[k];
    if (luck([i, j].toString()) < CACHE_SPAWN_PROB) {
      MakeCache(i, j);
    }
  }
}

const APP_NAME = "GeoToken Gatherer";
const app = document.querySelector<HTMLDivElement>("#app")!;
document.title = APP_NAME;
app.innerHTML = APP_NAME;

const header = document.createElement("h1");
app.append(header);

MakeControls();

const player = leaflet.marker(STARTING_POS);
player.bindTooltip("You are here");
player.addTo(map);

let playerTokens: number = 0;
const inventory = document.querySelector<HTMLDivElement>("#inventory")!;
inventory.innerHTML = `Tokens: ${playerTokens}\n${
  TokensToString(playerInventory)
}`;

// create the world board - holds all the cells for our game
const worldBoard = new Board(CELL_SIZE, NEIGHBORHOOD_SIZE, PLAYER_POS);
const neighbors: Cell[] = worldBoard.getCellsNearPoint(PLAYER_POS);
SpawnInNeighborhood(neighbors);
