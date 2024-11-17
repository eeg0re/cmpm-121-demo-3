// import important things here
import leaflet from "leaflet";
import "./style.css";
import "leaflet/dist/leaflet.css";
import "./leafletWorkaround.ts";
import luck from "./luck.ts";
import { Board, Cell, GeoCache, Token } from "./board.ts";

//const STARTING_POS = leaflet.latLng(36.98949379578401, -122.06277128548504);
const STARTING_POS: leaflet.latlng = leaflet.latLng(0, 0);

const ZOOM_LVL: number = 19;
const CELL_SIZE: number = 0.0001; // number of degrees in a cell
const CACHE_SPAWN_PROB: number = 0.1; // probability of a cache spawning in a cell
const NEIGHBORHOOD_SIZE: number = 8;
const MAX_TOKENS: number = 10;

let player_pos: leaflet.latlng = STARTING_POS;

const playerInventory: Token[] = [];

const map: leaflet.Map = leaflet.map("map", { // create our map starting at Oakes Classroom
  center: player_pos,
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

function MovePlayer(position: leaflet.LatLng) {
  player.setLatLng(position).update();
  //worldBoard.updatePlayerPosition(position);
  const playerMovedEvent = new CustomEvent("player moved", {
    detail: { position },
  });
  document.dispatchEvent(playerMovedEvent);
}

document.addEventListener("player moved", () => {
  // const neighbors: Cell[] = worldBoard.getCellsNearPoint(player_pos);
  // SpawnInNeighborhood(neighbors);
  map.setView(player_pos);
});

function UpdatePlayerPos(sign: string) {
  switch (sign) {
    case "up":
      player_pos.lat += CELL_SIZE;
      MovePlayer(player_pos);
      break;
    case "down":
      player_pos.lat -= CELL_SIZE;
      MovePlayer(player_pos);
      break;
    case "left":
      player_pos.lng -= CELL_SIZE;
      MovePlayer(player_pos);
      break;
    case "right":
      player_pos.lng += CELL_SIZE;
      MovePlayer(player_pos);
      break;
    case "reset":
      player_pos = STARTING_POS;
      MovePlayer(player_pos);
      break;
  }
}

function MakeControls() {
  const controlSection = document.querySelector<HTMLDivElement>("#controls")!;
  const locationButton = document.createElement("button");
  controlSection.append(locationButton);
  locationButton.innerHTML = "🌎";

  const upButton = document.createElement("button");
  controlSection.append(upButton);
  upButton.innerHTML = "⬆️";
  upButton.addEventListener("click", () => {
    UpdatePlayerPos("up");
  });

  const leftButton = document.createElement("button");
  controlSection.append(leftButton);
  leftButton.innerHTML = "⬅️";
  leftButton.addEventListener("click", () => {
    UpdatePlayerPos("left");
  });

  const rightButton = document.createElement("button");
  controlSection.append(rightButton);
  rightButton.innerHTML = "➡️";
  rightButton.addEventListener("click", () => {
    UpdatePlayerPos("right");
  });

  const downButton = document.createElement("button");
  controlSection.append(downButton);
  downButton.innerHTML = "⬇️";
  downButton.addEventListener("click", () => {
    UpdatePlayerPos("down");
  });

  const trashButton = document.createElement("button");
  controlSection.append(trashButton);
  trashButton.innerHTML = "🗑️";
  trashButton.addEventListener("click", () => {
    UpdatePlayerPos("reset");
  });
}

// this function written with the help of brace: https://chat.brace.tools/s/5efd7b0d-c596-4757-971b-e202d974c948
function updatePopupValue(popupDiv: HTMLDivElement, numTokens: string): void {
  const valueSpan = popupDiv.querySelector<HTMLSpanElement>("#value")!;
  if (valueSpan) {
    valueSpan.innerHTML = numTokens;
  } else {
    console.error("Element with ID #value not found in popupDiv");
  }
}

// this function written with the help of brace: https://chat.brace.tools/s/5efd7b0d-c596-4757-971b-e202d974c948
function updatePopupTokens(popupDiv: HTMLDivElement, tokenStr: string): void {
  const tokensSpan = popupDiv.querySelector<HTMLSpanElement>("#tokens")!;
  if (tokensSpan) {
    tokensSpan.innerHTML = tokenStr;
  } else {
    console.error("Element with ID #tokens not found in popupDiv");
  }
}

function ChangePopupText(popupDiv: HTMLDivElement, cache: GeoCache) {
  updatePopupValue(popupDiv, cache.cacheTokens.length.toString());
  updatePopupTokens(popupDiv, TokensToString(cache.cacheTokens));
}

function updateInventory() {
  inventory.innerHTML = `Tokens: ${playerTokens}\n${
    TokensToString(playerInventory)
  }`;
}

function DepositToken(cache: GeoCache): Token[] | undefined {
  if (playerInventory.length > 0) {
    playerTokens--;
    cache.cacheTokens.push(playerInventory.pop()!);
    updateInventory();
    return cache.cacheTokens;
  }
  return undefined;
}

function WithdrawToken(cache: GeoCache) {
  if (cache.cacheTokens.length > 0) {
    playerTokens++;
    playerInventory.push(cache.cacheTokens.pop()!);
    updateInventory();
    return cache.cacheTokens;
  }
  return undefined;
}

// function written with the help of brace: https://chat.brace.tools/s/5efd7b0d-c596-4757-971b-e202d974c948
function createPopupElement(
  i: number,
  j: number,
  numTokens: number,
  tokenStr: string,
): HTMLDivElement {
  const popupDiv = document.createElement("div");
  popupDiv.innerHTML = `
          <div>This is cache "${i},${j}". It has <span id="value">${numTokens}</span> Tokens.\n<spand id="tokens">${tokenStr}</span></div>
          <button id="withdraw">Withdraw</button>
          <button id="deposit">Deposit</button>`;
  return popupDiv;
}

// function written with the help of brace: https://chat.brace.tools/s/5efd7b0d-c596-4757-971b-e202d974c948
function setupPopupListeners(popupDiv: HTMLDivElement, cache: GeoCache): void {
  popupDiv.querySelector<HTMLButtonElement>("#withdraw")!.addEventListener(
    "click",
    () => {
      const updatedCache = WithdrawToken(cache);
      if (updatedCache) {
        cache.cacheTokens = updatedCache;
      }
      ChangePopupText(popupDiv, cache);
    },
  );

  popupDiv.querySelector<HTMLButtonElement>("#deposit")!.addEventListener(
    "click",
    () => {
      const updatedCache = DepositToken(cache);
      if (updatedCache) {
        cache.cacheTokens = updatedCache;
      }
      ChangePopupText(popupDiv, cache);
    },
  );
}

function CreateCachePopup(rect: leaflet.rectangle, cache: GeoCache): Token[] {
  const { i, j } = cache.cell;
  rect.addTo(map);

  rect.bindPopup(() => {
    const numTokens = Math.floor(
      luck([i, j, "initialValue"].toString()) * MAX_TOKENS,
    );

    cache.cacheTokens = MakeTokens({ i, j }, numTokens);
    const tokenStr = TokensToString(cache.cacheTokens);

    const popupDiv = createPopupElement(i, j, numTokens, tokenStr);
    setupPopupListeners(popupDiv, cache);
    return popupDiv;
  });
  return cache.cacheTokens;
}

export function toMomento(cache: GeoCache): string {
  return JSON.stringify(cache);
}

export function fromMomento(momento: string): GeoCache {
  return JSON.parse(momento);
}

function MakeCache(i: number, j: number): GeoCache {
  const bounds = worldBoard.getCellBounds({ i, j });

  const rect = leaflet.rectangle(bounds);

  const cache: GeoCache = { cell: { i, j }, cacheTokens: [] };

  cache.cacheTokens = CreateCachePopup(rect, cache);
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
const worldBoard = new Board(CELL_SIZE, NEIGHBORHOOD_SIZE);
const neighbors: Cell[] = worldBoard.getCellsNearPoint(player_pos);
SpawnInNeighborhood(neighbors);
