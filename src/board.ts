import leaflet from "leaflet";

interface Cell {
  readonly i: number;
  readonly j: number;
}

const CELL_SIZE = 0.01;

export class Board {
  readonly tileWidth: number;
  readonly tileVisibilityRadius: number;

  private readonly knownCells: Map<string, Cell>;

  constructor(tileWidth: number, tileVisibilityRadius: number) {
    // ...
    this.tileWidth = tileWidth;
    this.tileVisibilityRadius = tileVisibilityRadius;
    this.knownCells = new Map();
  }

  private getCanonicalCell(cell: Cell): Cell {
    const { i, j } = cell;
    const key = [i, j].toString();
    // ...
    return this.knownCells.get(key)!;
  }

  getCellForPoint(point: leaflet.LatLng): Cell {
    return this.getCanonicalCell({
      i: point.lat,
      j: point.lng,
    });
  }

  getCellBounds(cell: Cell): leaflet.LatLngBounds {
    const { i, j } = cell;
    const origin = leaflet.latLng(i, j);
    const bounds = leaflet.latLngBounds([
      [origin.lat + i * CELL_SIZE, origin.lng + j * CELL_SIZE],
      [origin.lat + (i + 1) * CELL_SIZE, origin.lng + (j + 1) * CELL_SIZE],
    ]);
    return bounds;
  }

  getCellsNearPoint(point: leaflet.LatLng): Cell[] {
    const resultCells: Cell[] = [];
    const originCell = this.getCellForPoint(point);
    // ...
    const radius = this.tileVisibilityRadius;
    for (let i = -radius; i <= radius; i++) {
      for (let j = -radius; j <= radius; j++) {
        const cell = this.getCanonicalCell({
          i: originCell.i + i,
          j: originCell.j + j,
        });
        resultCells.push(cell);
      }
    }
    return resultCells;
  }
}
