import { Deck } from "@deck.gl/core";
import { TileLayer } from "@deck.gl/geo-layers";
import { BitmapLayer, ScatterplotLayer } from "@deck.gl/layers";

type AccidentData = {
  coordinates: [number, number];
  casualties: number;
  severity: number;
  nbrVehicles: number;
};

class MapVisualization {
  private readonly canvas: HTMLCanvasElement;
  private readonly deck: Deck;
  private readonly data: Array<AccidentData>;

  constructor(canvas: HTMLCanvasElement, data: Array<AccidentData>) {
    this.canvas = canvas;
    this.data = data;
    this.deck = new Deck({
      canvas: canvas,
      useDevicePixels: 3,
      initialViewState: {
        longitude: -5.242559,
        latitude: 54.861987,
        zoom: 5.25,
      },
      layers: [
        new TileLayer<ImageBitmap>({
          data: ["http://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"],
          maxRequests: 20,
          minZoom: 0,
          maxZoom: 21,
          tileSize: 256,
          renderSubLayers: (props) => {
            const [[west, south], [east, north]] = props.tile.boundingBox;
            const { data, ...otherProps } = props;
            return [
              new BitmapLayer(otherProps, {
                image: data,
                bounds: [west, south, east, north],
              }),
            ];
          },
        }),
        new ScatterplotLayer({
          id: "casualties-layer",
          data: data,
          getPosition: (d: AccidentData) => d.coordinates,
          getRadius: (d: AccidentData) => d.casualties,
          getFillColor: (d: AccidentData) => [d.severity, 0, 0],
          radiusScale: 3,
        }),
      ],
      controller: {

      },
    });
  }
}

export { MapVisualization };
