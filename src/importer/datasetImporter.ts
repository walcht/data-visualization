import {
  AccidentData,
  CarriagewayHazards,
  JunctionControl,
  LightConditions,
  PedestrianCrossingPhysicalFacilities,
  RoadSurfaceConditions,
  RoadType,
  SpecialConditionsAtSite,
  WeatherConditions,
} from "../interfaces/AccidentData";

async function datasetImporter(dataset: File): Promise<Array<AccidentData>> {
  const res = new Array<AccidentData>();
  const textContent = await dataset.text();
  const lines = textContent.split("\n");
  let ignored = 0;
  for (let i = 0; i < lines.length; ++i) {
    // first line contains attribute names
    if (i == 0) {
      continue;
    }
    const split = lines[i].split(",");
    const rawAS = Number(split[6]);
    const accidentSeverity =
      rawAS != 1 && rawAS != 2 && rawAS != 3 ? undefined : rawAS;
    if (accidentSeverity == undefined) {
      throw new Error(
        `accident severity takes a value other than: 1 | 2 | 3: ${rawAS}`,
      );
    }
    const rawRT = split[16].toLowerCase();
    const roadType: RoadType =
      rawRT == "dual carriageway"
        ? RoadType.DUAL_CARRIAGEWAY
        : rawRT == "one way street"
        ? RoadType.ONE_WAY_STREET
        : rawRT == "roundabout"
        ? RoadType.ROUNDABOUT
        : rawRT == "single carriageway"
        ? RoadType.SINGLE_CARRIAGEWAY
        : rawRT == "slip road"
        ? RoadType.SLIP_ROAD
        : RoadType.UNKNOWN;
    const rawJC = split[19].toLowerCase();
    const junctionControl: JunctionControl =
      rawJC == "authorised person"
        ? JunctionControl.AUTHORISED_PERSON
        : rawJC == "automatic traffic signal"
        ? JunctionControl.AUTOMATIC_TRAFFIC_SIGNAL
        : rawJC == "giveway or uncontrolled"
        ? JunctionControl.GIVEWAY_OR_UNCONTROLLED
        : rawJC == "stop sign"
        ? JunctionControl.STOP_SIGN
        : JunctionControl.UNKNOWN;
    // 18/01/2005 11:15
    // split[9] in:   DD/MM/YYYY
    // split[11] in:  HH/MM
    const dateSplit = split[9].split("/");
    // format: YYYY-MM-DDTHH:mm
    const _date = new Date(
      `${dateSplit[2]}-${dateSplit[1]}-${dateSplit[0]}T${split[11].replace(
        "/",
        ":",
      )}`,
    );
    if (Number.isNaN(_date.valueOf())) {
      ++ignored;
      continue;
    }
    const pedestrianCrossing: PedestrianCrossingPhysicalFacilities =
      split[23] == "Central refuge"
        ? PedestrianCrossingPhysicalFacilities["Central refuge"]
        : split[23] == "Footbridge or subway"
        ? PedestrianCrossingPhysicalFacilities["Footbridge or subway"]
        : split[23] == "No physical crossing within 50 meters"
        ? PedestrianCrossingPhysicalFacilities[
            "No physical crossing within 50 meters"
          ]
        : split[23] == "Pedestrian phase at traffic signal junction"
        ? PedestrianCrossingPhysicalFacilities[
            "Pedestrian phase at traffic signal junction"
          ]
        : split[23] == "Zebra crossing"
        ? PedestrianCrossingPhysicalFacilities["Zebra crossing"]
        : split[23] == "non-junction pedestrian crossing"
        ? PedestrianCrossingPhysicalFacilities[
            "non-junction pedestrian crossing"
          ]
        : PedestrianCrossingPhysicalFacilities.UNKNOWN;
    const lightConditions: LightConditions =
      split[24] == "Darkeness: No street lighting"
        ? LightConditions["Darkeness: No street lighting"]
        : split[24] == "Darkness: Street lighting unknown"
        ? LightConditions["Darkness: Street lighting unknown"]
        : split[24] == "Darkness: Street lights present and lit"
        ? LightConditions["Darkness: Street lights present and lit"]
        : split[24] == "Darkness: Street lights present but unlit"
        ? LightConditions["Darkness: Street lights present but unlit"]
        : split[24] == "Daylight: Street light present"
        ? LightConditions["Daylight: Street light present"]
        : LightConditions.UNKNOWN;
    const weatherConditions: WeatherConditions =
      split[25] == "Fine with high winds"
        ? WeatherConditions["Fine with high winds"]
        : split[25] == "Fine without high winds"
        ? WeatherConditions["Fine without high winds"]
        : split[25] == "Fog or mist"
        ? WeatherConditions["Fog or mist"]
        : split[25] == "Other"
        ? WeatherConditions.Other
        : split[25] == "Raining with high winds"
        ? WeatherConditions["Raining with high winds"]
        : split[25] == "Raining without high winds"
        ? WeatherConditions["Raining without high winds"]
        : split[25] == "Snowing with high winds"
        ? WeatherConditions["Snowing with high winds"]
        : split[25] == "Snowing without high winds"
        ? WeatherConditions["Snowing without high winds"]
        : WeatherConditions.UNKNOWN;
    const roadSurfaceConditions: RoadSurfaceConditions =
      split[26] == "Dry"
        ? RoadSurfaceConditions["Dry"]
        : split[26] == "Flood (Over 3cm of water)"
        ? RoadSurfaceConditions["Flood (Over 3cm of water)"]
        : split[26] == "Frost/Ice"
        ? RoadSurfaceConditions["Frost/Ice"]
        : split[26] == "Snow"
        ? RoadSurfaceConditions["Snow"]
        : split[26] == "Wet/Damp"
        ? RoadSurfaceConditions["Wet/Damp"]
        : RoadSurfaceConditions.UNKNOWN;
    const specialConditionsAtSite: SpecialConditionsAtSite =
      split[27] == "Auto traffic signal partly defective"
        ? SpecialConditionsAtSite["Auto traffic signal partly defective"]
        : split[27] == "Auto traffic singal out"
        ? SpecialConditionsAtSite["Auto traffic singal out"]
        : split[27] == "Mud"
        ? SpecialConditionsAtSite.Mud
        : split[27] == "Ol or diesel"
        ? SpecialConditionsAtSite["Ol or diesel"]
        : split[27] == "Permanent sign or marking defective or obscured"
        ? SpecialConditionsAtSite[
            "Permanent sign or marking defective or obscured"
          ]
        : split[27] == "Road surface defective"
        ? SpecialConditionsAtSite["Road surface defective"]
        : split[27] == "Roadworks"
        ? SpecialConditionsAtSite.Roadworks
        : SpecialConditionsAtSite.UNKNOWN;
    const carriagewayHazards: CarriagewayHazards =
      split[28] == "Any animal (except a ridden horse)"
        ? CarriagewayHazards["Any animal (except a ridden horse)"]
        : split[28] == "Dislodged vehicle load in carriageway"
        ? CarriagewayHazards["Dislodged vehicle load in carriageway"]
        : split[28] == "Involvement with previous accident"
        ? CarriagewayHazards["Involvement with previous accident"]
        : split[28] == "Other object in carriageway"
        ? CarriagewayHazards["Other object in carriageway"]
        : split[28] == "Pedestrian in carriageway (not injured)"
        ? CarriagewayHazards["Pedestrian in carriageway (not injured)"]
        : CarriagewayHazards.UNKNOWN;
    res.push({
      longitude: Number(split[3]),
      latitude: Number(split[4]),
      accidentSeverity: accidentSeverity,
      nbrOfVehicles: Number(split[7]),
      nbrOfCasualties: Number(split[8]),
      date: _date,
      roadType: roadType,
      speedLimit: parseInt(split[17], 10),
      juncitionControl: junctionControl,
      pedestrianCrossingPhysicalFacilities: pedestrianCrossing,
      lightConditions: lightConditions,
      weatherConditions: weatherConditions,
      roadSurfaceConditions: roadSurfaceConditions,
      specialConditionsAtSite: specialConditionsAtSite,
      carriagewayHazards: carriagewayHazards,
    });
  }
  if (ignored) {
    console.log(`ignored ${ignored} entries because of invalid Dates`);
  }
  return res;
}

export { datasetImporter };
