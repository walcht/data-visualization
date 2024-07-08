import {
  AccidentData,
  JunctionControl,
  RoadType,
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
    res.push({
      longitude: Number(split[3]),
      latitude: Number(split[4]),
      accidentSeverity: accidentSeverity,
      nbrOfVehicles: Number(split[7]),
      nbrOfCasualties: Number(split[8]),
      // format: YYYY-MM-DDTHH:mm
      date: _date,
      roadType: roadType,
      juncitionControl: junctionControl,
    });
  }
  if (ignored) {
    console.log(`ignored ${ignored} entries because of invalid Dates`);
  }
  return res;
}

export { datasetImporter };
