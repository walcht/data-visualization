enum JunctionControl {
  AUTHORISED_PERSON,
  AUTOMATIC_TRAFFIC_SIGNAL,
  GIVEWAY_OR_UNCONTROLLED,
  STOP_SIGN,
  UNKNOWN,
}

enum RoadType {
  DUAL_CARRIAGEWAY,
  ONE_WAY_STREET,
  ROUNDABOUT,
  SINGLE_CARRIAGEWAY,
  SLIP_ROAD,
  UNKNOWN,
}

enum AccidentSeverity {
  HIGH = 3,
  MID = 2,
  LOW = 1,
}

enum SpeedLimit {
  "10KMH" = 10,
  "15KMH" = 15,
  "20KMH" = 20,
  "30KMH" = 30,
  "40KMH" = 40,
  "50KMH" = 50,
  "60KMH" = 60,
  "70KMH" = 70,
  UNKNOWN = -1,
}

enum RoadSurfaceConditions {
  "Dry",
  "Flood (Over 3cm of water)",
  "Frost/Ice",
  "Snow",
  "Wet/Damp",
  UNKNOWN = -1,
}

enum WeatherConditions {
  "Fine with high winds",
  "Fine without high winds",
  "Fog or mist",
  "Other",
  "Raining with high winds",
  "Raining without high winds",
  "Snowing with high winds",
  "Snowing without high winds",
  UNKNOWN = -1,
}

enum LightConditions {
  "Darkeness: No street lighting",
  "Darkness: Street lighting unknown",
  "Darkness: Street lights present and lit",
  "Darkness: Street lights present but unlit",
  "Daylight: Street light present",
  UNKNOWN = -1,
}

enum PedestrianCrossingPhysicalFacilities {
  "Central refuge",
  "Footbridge or subway",
  "No physical crossing within 50 meters",
  "Pedestrian phase at traffic signal junction",
  "Zebra crossing",
  "non-junction pedestrian crossing",
  UNKNOWN = -1,
}

enum SpecialConditionsAtSite {
  "Auto traffic signal partly defective",
  "Auto traffic singal out",
  "Mud",
  "Ol or diesel",
  "Permanent sign or marking defective or obscured",
  "Road surface defective",
  "Roadworks",
  UNKNOWN = -1,
}

enum CarriagewayHazards {
  "Any animal (except a ridden horse)",
  "Dislodged vehicle load in carriageway",
  "Involvement with previous accident",
  "Other object in carriageway",
  "Pedestrian in carriageway (not injured)",
  UNKNOWN = -1,
}

interface AccidentData {
  /**
   * longitude in WGS84 in `degrees`
   */
  longitude: number;
  /**
   * latitude in WGS84 in `degrees`
   */
  latitude: number;
  accidentSeverity: AccidentSeverity;
  nbrOfVehicles: number;
  nbrOfCasualties: number;
  date: Date;
  roadType: RoadType;
  speedLimit: SpeedLimit;
  juncitionControl: JunctionControl;
  pedestrianCrossingPhysicalFacilities: PedestrianCrossingPhysicalFacilities;
  lightConditions: LightConditions;
  weatherConditions: WeatherConditions;
  roadSurfaceConditions: RoadSurfaceConditions;
  specialConditionsAtSite: SpecialConditionsAtSite;
  carriagewayHazards: CarriagewayHazards;
}

export {
  type AccidentData,
  RoadType,
  JunctionControl,
  AccidentSeverity,
  RoadSurfaceConditions,
  WeatherConditions,
  LightConditions,
  PedestrianCrossingPhysicalFacilities,
  SpecialConditionsAtSite,
  CarriagewayHazards,
  SpeedLimit,
};
