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

interface AccidentData {
  longitude: number;
  latitude: number;
  accidentSeverity: AccidentSeverity;
  nbrOfVehicles: number;
  nbrOfCasualties: number;
  date: Date;
  roadType: RoadType;
  // speedLimit: 10 | 15 | 20 | 30 | 40 | 50 | 60 | 70;
  juncitionControl: JunctionControl;
}

export { type AccidentData, RoadType, JunctionControl, AccidentSeverity };
