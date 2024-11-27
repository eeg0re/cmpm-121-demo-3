// import important things here
import leaflet from "leaflet";
import "./style.css";
import "leaflet/dist/leaflet.css";
import "./leafletWorkaround.ts";
import luck from "./luck.ts";
import { Board, Cell, GeoCache, Token } from "./board.ts";

const DEFAULT_SPAWN = leaflet.latLng(36.98949379578401, -122.06277128548504);
const ZOOM_LVL: number = 19;
const CELL_SIZE: number = 0.0001; // number of degrees in a cell
const CACHE_SPAWN_PROB: number = 0.1; // probability of a cache spawning in a cell
const NEIGHBORHOOD_SIZE: number = 1;
const MAX_TOKENS: number = 5;

let watchMovement: null | number; // variable to store the watchPosition method, used to clear location settings when the game is reset

let startingPos = DEFAULT_SPAWN;

let playerPos: leaflet.latlng = startingPos;

const playerInventory: Token[] = [];

let playerTokens: number = 0;

let spawning: boolean = true;

const map: leaflet.Map = leaflet.map("map", { // create our map starting at Oakes Classroom
  center: playerPos,
  zoom: ZOOM_LVL,
  minZoom: ZOOM_LVL,
  maxZoom: ZOOM_LVL,
  zoomControl: false,
  scrollWheelZoom: false,
});

const cacheGroup = leaflet.layerGroup().addTo(map);

const trackedCoords: leaflet.latlng[] = [playerPos];
const playerTrail = leaflet.polyline(trackedCoords, { color: "red" }).addTo(
  map,
);

// add the world background to the leaflet map
leaflet.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution:
    '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map);

function MovePlayer(position: leaflet.LatLng) {
  player.setLatLng(position).update();
  const playerMovedEvent = new CustomEvent("player moved", {
    detail: { position },
  });
  document.dispatchEvent(playerMovedEvent);
}

document.addEventListener("player moved", () => {
  UpdateVisibleCaches();
  map.setView(playerPos);
  if (!spawning) {
    trackedCoords.push(playerPos);
    playerTrail.addLatLng(playerPos).addTo(map);
  }
  spawning = false;
  StoreInfo();
});

function StoreInfo() {
  localStorage.setItem("playerPos", JSON.stringify(playerPos));
  localStorage.setItem("playerInventory", JSON.stringify(playerInventory));
}

function UpdatePlayerPos(sign: string) {
  switch (sign) {
    case "up":
      playerPos = leaflet.latLng(playerPos.lat + CELL_SIZE, playerPos.lng);
      MovePlayer(playerPos);
      break;
    case "down":
      playerPos = leaflet.latLng(playerPos.lat - CELL_SIZE, playerPos.lng);
      MovePlayer(playerPos);
      break;
    case "left":
      playerPos = leaflet.latLng(playerPos.lat, playerPos.lng - CELL_SIZE);
      MovePlayer(playerPos);
      break;
    case "right":
      playerPos = leaflet.latLng(playerPos.lat, playerPos.lng + CELL_SIZE);
      MovePlayer(playerPos);
      break;
    case "reset": {
      const certain = prompt(
        "Are you sure you want to reset the game? This will erase ALL your progress (yes/no)",
        "no",
      );
      if (certain === "yes") {
        ResetGame();
      }
      break;
    }
  }
}

function ResetPlayerLocation() {
  startingPos = DEFAULT_SPAWN;
  playerPos = startingPos;
  MovePlayer(startingPos);
}

function ClearInventory() {
  playerTokens = 0;
  playerInventory.length = 0;
  UpdateInventory();
}

function ClearMovementHistory() {
  trackedCoords.length = 0;
  trackedCoords.push(playerPos);
  playerTrail.setLatLngs(trackedCoords);
}

function ResetGame() {
  localStorage.clear();

  if (watchMovement) {
    navigator.geolocation.clearWatch(watchMovement);
  }

  ResetPlayerLocation();
  ClearMovementHistory();
  ClearInventory();
}

function MakeControls() {
  const controlSection = document.querySelector<HTMLDivElement>("#controls")!;

  const locationButton = document.createElement("button");
  controlSection.append(locationButton);
  locationButton.innerHTML = "🌎";
  locationButton.addEventListener("click", () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        playerPos = leaflet.latLng(
          position.coords.latitude,
          position.coords.longitude,
        );
        ClearMovementHistory();
        StoreInfo();
        MovePlayer(playerPos);
      },
      (error) => {
        console.error(`Could not get current position. Error: ${error}`);
      },
      { enableHighAccuracy: true },
    );

    map.setView(playerPos);

    // if device moves, update player position
    watchMovement = navigator.geolocation.watchPosition((position) => {
      playerPos = leaflet.latLng(
        position.coords.latitude,
        position.coords.longitude,
      );
      trackedCoords.push(playerPos);
      playerTrail.addLatLng(playerPos);
      MovePlayer(playerPos);
    });
  });

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

function UpdateInventory() {
  inventory.innerHTML = `Tokens: ${playerTokens}\n${
    TokensToString(playerInventory)
  }`;
}

function CreateCacheKey(cache: GeoCache): string {
  return [cache.cell.i, cache.cell.j].toString();
}

function DepositToken(cache: GeoCache): Token[] | undefined {
  if (playerInventory.length > 0) {
    playerTokens--;
    cache.cacheTokens.push(playerInventory.pop()!);
    UpdateInventory();
    saveMomento(CreateCacheKey(cache), cache);
    StoreInfo();
    return cache.cacheTokens;
  }
  return undefined;
}

function WithdrawToken(cache: GeoCache) {
  if (cache.cacheTokens.length > 0) {
    playerTokens++;
    playerInventory.push(cache.cacheTokens.pop()!);
    UpdateInventory();
    saveMomento(CreateCacheKey(cache), cache);
    StoreInfo();
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
  // this function rewritten with the help of brace: https://chat.brace.tools/s/5efd7b0d-c596-4757-971b-e202d974c948
  const { i, j } = cache.cell;
  rect.addTo(cacheGroup);

  if (loadMomento(CreateCacheKey(cache)) === null) {
    cache.cacheTokens = MakeTokens(
      cache.cell,
      Math.floor(luck([i, j, "initialValue"].toString()) * MAX_TOKENS),
    );
    saveMomento(CreateCacheKey(cache), cache);
  }

  rect.bindPopup(() => {
    const tokenStr = TokensToString(cache.cacheTokens);
    const popupDiv = createPopupElement(
      i,
      j,
      cache.cacheTokens.length,
      tokenStr,
    );
    setupPopupListeners(popupDiv, cache);
    return popupDiv;
  });
  return cache.cacheTokens;
}

// saveMomento and loadMomento functions written with the help of brace: https://chat.brace.tools/s/5efd7b0d-c596-4757-971b-e202d974c948
function saveMomento(cacheKey: string, cache: GeoCache): void {
  const momento: string = JSON.stringify(cache);
  localStorage.setItem(cacheKey, momento);
}

function loadMomento(cacheKey: string): GeoCache | null {
  const momento = localStorage.getItem(cacheKey);
  if (momento) {
    try {
      return JSON.parse(momento);
    } catch (error) {
      console.error(`Error parsing cache momento for key ${cacheKey} `, error);
      localStorage.removeItem(cacheKey);
    }
    return null;
  }
  return null;
}

function MakeCache(i: number, j: number): GeoCache {
  const cacheKey: string = [i, j].toString();
  const cacheMomento = loadMomento(cacheKey);
  const bounds = worldBoard.getCellBounds({ i, j });
  const rect = leaflet.rectangle(bounds);

  let cache: GeoCache;

  if (cacheMomento) {
    cache = {
      cell: { i, j },
      cacheTokens: cacheMomento.cacheTokens,
    };
    CreateCachePopup(rect, cache);
  } else {
    cache = { cell: { i, j }, cacheTokens: [] };
    cache.cacheTokens = CreateCachePopup(rect, cache);
    saveMomento(cacheKey, cache);
  }

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

function UpdateVisibleCaches(): void {
  cacheGroup.clearLayers();
  map.removeLayer(cacheGroup);
  const neighbors: Cell[] = worldBoard.getCellsNearPoint(playerPos);
  SpawnInNeighborhood(neighbors);
  cacheGroup.addTo(map);
}

function StartGame() {
  const playerPosStr = localStorage.getItem("playerPos");
  const playerInventoryStr = localStorage.getItem("playerInventory");

  spawning = true;

  if (playerPosStr) {
    startingPos = JSON.parse(playerPosStr);
    playerPos = startingPos;
    MovePlayer(playerPos);
  } else {
    startingPos = DEFAULT_SPAWN;
    playerPos = startingPos;
    MovePlayer(playerPos);
  }

  if (playerInventoryStr) {
    playerInventory.push(...JSON.parse(playerInventoryStr));
    playerTokens = playerInventory.length;
    UpdateInventory();
  } else {
    playerInventory.length = 0;
    playerTokens = 0;
    UpdateInventory();
  }

  ClearMovementHistory();
}

const APP_NAME = "GeoToken Gatherer";
const app = document.querySelector<HTMLDivElement>("#app")!;
document.title = APP_NAME;
app.innerHTML = APP_NAME;

const header = document.createElement("h1");
app.append(header);

const inventory = document.querySelector<HTMLDivElement>("#inventory")!;
inventory.innerHTML = `Tokens: ${playerTokens} \n${
  TokensToString(playerInventory)
}`;

const player = leaflet.marker(startingPos);
player.bindTooltip("You are here");
player.addTo(map);

const worldBoard: Board = new Board(CELL_SIZE, NEIGHBORHOOD_SIZE);
const neighbors: Cell[] = worldBoard.getCellsNearPoint(playerPos);

StartGame();
MakeControls();
SpawnInNeighborhood(neighbors);
