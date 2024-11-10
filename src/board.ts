import leaflet from "leaflet";

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
}

export class Board {
  readonly tileWidth: number;
  readonly tileVisibilityRadius: number;

  // keep track of player position in the board
  PLAYER_POS: leaflet.LatLng;

  private readonly knownCells: Map<string, Cell>;

  constructor(
    tileWidth: number,
    tileVisibilityRadius: number,
    playerPosition: leaflet.LatLng,
  ) {
    this.tileWidth = tileWidth;
    this.tileVisibilityRadius = tileVisibilityRadius;
    this.knownCells = new Map<string, Cell>();
    this.PLAYER_POS = playerPosition;
  }

  private getCanonicalCell(cell: Cell): Cell {
    const { i, j } = cell;
    const key = [i, j].toString();
    if (!this.knownCells.has(key)) {
      this.knownCells.set(key, { i, j });
    }
    return this.knownCells.get(key)!;
  }

  getCellForPoint(point: leaflet.LatLng): Cell {
    return this.getCanonicalCell({
      i: point.lat,
      j: point.lng,
    });
  }

  getPointForCell(cell: Cell): leaflet.LatLng {
    return leaflet.latLng(cell.i, cell.j);
  }

  getCellBounds(cell: Cell): leaflet.LatLngBounds {
    const { i, j } = cell;
    const bounds = leaflet.latLngBounds([[i, j], [
      i + this.tileWidth,
      j + this.tileWidth,
    ]]);
    return bounds;
  }

  getCellsNearPoint(point: leaflet.LatLng): Cell[] {
    const resultCells: Cell[] = [];
    const radius = this.tileVisibilityRadius;
    for (let i = -radius; i <= radius; i++) {
      for (let j = -radius; j <= radius; j++) {
        const cell = this.getCanonicalCell({
          i: point.lat + i * this.tileWidth,
          j: point.lng + j * this.tileWidth,
        });
        resultCells.push(cell);
      }
    }
    return resultCells;
  }

  updatePlayerPosition(newPosition: leaflet.LatLng) {
    this.PLAYER_POS = newPosition;
  }
}
