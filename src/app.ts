import { existsSync as fsExists } from "node:fs";
import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import * as readline from "node:readline/promises";
/* Unused
import util from "node:util";
*/
import cliProgress from "cli-progress";
import "./types/Internal";
import { Config, DataOutput, ModuleResult, ReSanctuaryFile, Item } from "./types/Internal";
// TODO: const stripJsonComments = require("strip-json-comments");
import { XivApi, MJIItemPouchEntry, Resolution, ConstructorProperties } from "@xivapi/js";
let xiv: XivApi | undefined;

const __config: string = path.join(__dirname, "config.json");

let config: Config | undefined;

const __inputFile: string = path.join(__dirname, "ReSanctuary.json");

const __outputFile: string = path.join(__dirname, "ReSanctuary_out.json");

const bar: cliProgress.SingleBar = new cliProgress.SingleBar(
  {
    hideCursor: true,
    format:
      "[{bar}] {percentage}% | Duration: {duration_formatted} | ETA: {eta_formatted} | {value}/{total}",
    formatTime: cliProgress.Format.TimeFormat,
  },
  cliProgress.Presets.shades_classic,
);

let apiKey: string;

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

const lang: { [key: string]: string } = { default: "", de: "_de", en: "_en", fr: "_fr", ja: "_ja" };

async function runGetData(content: string, id: number): Promise<MJIItemPouchEntry> {
  let data: MJIItemPouchEntry;
  try {
    data = await xiv.data.get(content, id.toString());
  } catch (error) {
    console.error(error);
  }

  await sleep(2000);
  return data;
}

/* Output Javascript Object Schema
 * [
 *   {
 *     id: int,
 *     singular: string
 *   }
 * ]
 */
async function find(resolution: Resolution): Promise<DataOutput[]> {
  const results: DataOutput[] = [];
  bar.start(resolution.Pagination.ResultsTotal, 0, {
    speed: "N/A",
  });

  const getEntry = async (index: number): Promise<MJIItemPouchEntry> => {
    const result: MJIItemPouchEntry = await runGetData("MJIItemPouch", index);
    bar.update(index);
    return result;
  };

  const getEntries = async (total: number): Promise<MJIItemPouchEntry[]> => {
    const promises: Promise<MJIItemPouchEntry>[] = [];

    for (let index: number = 0; index <= total; index++) {
      promises.push(getEntry(index));
    }

    const output: Promise<MJIItemPouchEntry[]> = Promise.all(promises);
    return output;
  };

  const xivResults: MJIItemPouchEntry[] = await getEntries(resolution.Pagination.ResultsTotal);

  for (let i: number = 0; i <= xivResults.length; i++) {
    console.log(results[i]);

    try {
      bar.update(i);
      results.push(new ModuleResult(xivResults[i].ID, (xivResults[i].Item as Item).getName(lang[config.lang])));
    } catch (error) {
      console.error(error);
    }
  }

  bar.stop();
  return results;
}

async function getString(): Promise<DataOutput[]> {
  let resolution: Resolution;
  let resolution2: DataOutput[];

  try {
    resolution = await xiv.data.list("MJIItemPouch");
  } catch (error) {
    console.error(error);
  }

  if (resolution.Pagination.ResultsTotal > 0) {
    resolution2 = await find(resolution);
  }

  return resolution2;
}

/* Unused
function displayJson(json: XIVAPIResult) {
  if (json.Url) {
    json.Url = `https://xivapi.com${json.Url}`;
  }

  console.log(util.inspect(json, { showHidden: false, depth: null, colors: true }));
}
*/

async function calcLineLengths(): Promise<{ [key: string]: number }> {
  const inputStream = fsSync.createReadStream(__inputFile);
  const lineLengths: { [key: string]: number } = {};

  const readlines = readline.createInterface({
    input: inputStream,
    crlfDelay: Infinity,
  });
  // Note: we use the crlfDelay option to recognize all instances of CR LF
  // ('\r\n') in input.txt as a single line break.

  let foundTodoList = 0;
  let i = 1;
  const regexp = /"(d{1,4})": d+,?/;
  for await (const line of readlines) {
    let outputLength: number;
    if (foundTodoList === 0 && line.toLowerCase().includes("todolist")) {
      foundTodoList = i;
    }

    const matched = line.match(regexp);
    if (foundTodoList !== 0) {
      if (line.toLowerCase().includes("},")) {
        foundTodoList = -1;
      } else if (regexp.test(line)) {
        outputLength = line.length;
        lineLengths[matched[1]] = outputLength;
      }
    }

    console.log(`Line from file: "${line}".length === ${outputLength}`);
    // Each line in input.txt will be successively available here as `line`.
    i++;
  }

  lineLengths.longest = Math.max(...Object.values(lineLengths));
  return lineLengths;
}

function transformLine(line: string, lineLengths: { [key: string]: number }, name: string): string {
  const difference = lineLengths.longest - line.length;
  let newLine: string = line;
  if (difference > 0) {
    console.error("Line difference is not calculated correctly.");
    console.error(` - lineLengths.longest: ${lineLengths.longest}`);
    console.error(` - line.length:         ${line.length}`);
    return line;
  }

  for (let i = 0; i < difference; i++) {
    newLine += " ";
  }

  if (newLine.length !== lineLengths.longest) {
    console.error("Line difference is not calculated correctly.");
    console.error(` - lineLengths.longest: ${lineLengths.longest}`);
    console.error(` - line.length:         ${line.length}`);
    console.error(` - newLine.length:      ${newLine.length}`);
    return line;
  }

  newLine += ` // ${name}`;
  return newLine;
}

async function parseInputFile(input: ReSanctuaryFile, data: DataOutput[]) {
  const lineLengths = await calcLineLengths();
  const inputStream = fsSync.createReadStream(__inputFile);
  const outputStream = fsSync.createWriteStream(__outputFile, { encoding: "utf8" });

  const readlines = readline.createInterface({
    input: inputStream,
    crlfDelay: Infinity,
    output: outputStream,
  });
  // Note: we use the crlfDelay option to recognize all instances of CR LF
  // ('\r\n') in input.txt as a single line break.

  let foundTodoList = 0;
  let i = 1;
  const regexp = /"(d{1,4})": d+,?/;
  for await (const line of readlines) {
    const inputLine = line;
    let outputLine = "";
    if (!line.toLowerCase().includes("todolist")) {
      readlines.write(line);
    }

    if (foundTodoList === 0 && line.toLowerCase().includes("todolist")) {
      foundTodoList = i;
      readlines.write(line);
    }

    const matched = line.match(regexp);
    if (foundTodoList !== 0) {
      if (line.toLowerCase().includes("},")) {
        foundTodoList = -1;
      } else if (/"d{1,4}": d+,?/.test(line)) {
        outputLine = transformLine(
          line,
          lineLengths,
          data.find((x) => x.id.toString() === matched[1]).singular,
        );
        readlines.write(outputLine);
        console.log(`Line from file: ${inputLine} => ${outputLine}`);
      }
    }

    // Each line in input.txt will be successively available here as `line`.
    i++;
  }

  readlines.close();
}

(async function () {
  if (!fsExists(__config)) {
    console.error({ message: `Config, ${__config} does not exist.` });
    return;
  }

  try {
    const _config: string = await fs.readFile(__config, { encoding: "utf-8" });
    config = new Config(JSON.parse(_config));
  } catch (error) {
    console.error(error);
  }

  // - Possibly going to be unused code.
  // config = JSON.parse(stripJsonComments(config));
  const _out: string = path.join(__dirname, config.output);
  apiKey = config.credentials.apiKey;
  const tempData: ConstructorProperties = {
    language: config.lang,
    /* eslint-disable-next-line camelcase */
    snake_case: true,
    /* eslint-disable-next-line camelcase */
    private_key: undefined
  };
  if (apiKey !== "" && apiKey !== undefined) {
    /* eslint-disable-next-line camelcase */
    tempData.private_key = apiKey;
  }

  if (typeof tempData.private_key === "undefined") {
    delete tempData.private_key;
  }

  xiv = new XivApi(tempData);
  let gottenJson: { [key: string]: DataOutput[] } = {};
  let inputJson: ReSanctuaryFile;
  let stringedGottenJson: string;

  if (fsExists(_out)) {
    try {
      const dataFile: string = await fs.readFile(_out, { encoding: "utf-8", flag: "r+" });
      gottenJson = (JSON.parse(dataFile) as { [key: string]: DataOutput[] });
    } catch (error) {
      console.error(error);
    }
  } else {
    let gotten: DataOutput[] = [];
    try {
      gotten = await getString();
    } catch (error) {
      console.error(error);
    }

    try {
      gottenJson = { data: gotten };
      stringedGottenJson = JSON.stringify(gottenJson, null, 2);
    } catch (error) {
      console.error(error);
    }

    try {
      await fs.writeFile(_out, stringedGottenJson, { encoding: "utf-8", flag: "w", mode: 0o666 });
    } catch (error) {
      console.error(error);
    }
  }

  if (fsExists(__inputFile)) {
    try {
      const inputFile: string = await fs.readFile(__inputFile, { encoding: "utf-8", flag: "r+" });
      inputJson = (JSON.parse(inputFile) as ReSanctuaryFile);
    } catch (error) {
      console.error(error);
    }
  } else {
    console.error(new Error(`Input file does not exist at: ${__inputFile}!`));
  }

  await parseInputFile(inputJson, gottenJson.data);
})().catch((reason) => {
  console.error(reason);
});
