import { existsSync as fsExists } from "fs";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import path from "path";
import XivApi from "@xivapi/js";
import * as readline from "node:readline/promises";
import { EOL } from "os";
/* - Possibly going to be unused code.
 * import cliProgress from "cli-progress";
 */
/* - Possibly going to be unused code.
 * import stripJsonComments from "strip-json-comments";
 */
import util from "util";
const xiv = new XivApi();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const __config = path.join(__dirname, "config.json");

const __inputFile = path.join(__dirname, "ReSanctuary.json");

const __outputFile = path.join(__dirname, "ReSanctuary_out.json");
/* - Possibly going to be unused code.
 * const bar = new cliProgress.SingleBar(
 *   {
 *     hideCursor: true,
 *     format:
 *       "[{bar}] {percentage}% | Duration: {duration_formatted} | ETA: {eta_formatted} | {value}/{total}",
 *     formatTime: cliProgress.formatTime,
 *   },
 *   cliProgress.Presets.shades_classic,
 * );
 */
let out;
let apiKey;

function sleep(ms) {
  return new Promise((r) => {
    setTimeout(r, ms);
  });
}

const lang = { default: "", de: "_de", en: "_en", fr: "_fr", ja: "_ja" };

async function runGetData(content, id) {
  let data;
  try {
    data = await xiv.data.get(content, id.toString());
  } catch (error) {
    console.error({ message: error.message, stack: error.stack });
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
async function find(resolution) {
  const results = [];
  /* - Possibly going to be unused code.
   * bar.start(res.Pagination.ResultsTotal, 0, {
   *   speed: "N/A",
   * });
   */

  for (let i = 0; i <= resolution.Pagination.ResultsTotal; i++) {
    let result = await runGetData("MJIItemPouch", i.toString())
    /* - Possibly going to be unused code.
     * bar.update(i);
     */
    results.push(result);
  }

  for (const result of results) {
    console.log(result);

    try {
      /* - Possibly going to be unused code.
       * bar.update(i);
       */
      results.push({ id: result.ID, singular: result.Item[`Name${lang[__config.lang]}`] });
    } catch (error) {
      console.error({ message: error.message, stack: error.stack });
    }
  }

  /* - Possibly going to be unused code.
   * bar.stop();
   */
  return results;
}

async function getString() {
  let resolution;

  try {
    resolution = await xiv.data.list("MJIItemPouch");
  } catch (error) {
    console.error({ message: error.message, stack: error.stack });
  }

  if (resolution.Pagination.ResultsTotal > 0) {
    resolution = await find(resolution);
  }

  return resolution;
}

function displayJson(json) {
  if (json.Url) {
    json.Url = `https://xivapi.com${json.Url}`;
  }

  console.log(util.inspect(json, { showHidden: false, depth: null, colors: true }));
}

async function calcLineLengths() {
  const inputStream = fs.createReadStream(__inputFile);
  const lineLengths = {};

  const readlines = readline.createInterface({
    input: inputStream,
    crlfDelay: Infinity
  });
  // Note: we use the crlfDelay option to recognize all instances of CR LF
  // ('\r\n') in input.txt as a single line break.

  let foundTodoList = 0;
  let i = 1;
  const regexp = new RegExp("\"(\d{1,4})\": \d+,?");
  for await (const line of readlines) {
    let outputLength = "";
    if (foundTodoList === 0 && line.toLowerCase.includes("todolist")) {
      foundTodoList = i;
    }
    const matched = line.match(regexp);
    if (foundTodoList !== 0) {
      if (line.toLowerCase.includes("},")) {
        foundTodoList = -1;
      } else if (regexp.test(line)) {
        outputLength = line.length;
        lineLengths[matched[1]] = outputLength;
      }
    }
    console.log(`Line from file: "${inputLine}".length === ${length}`);
    // Each line in input.txt will be successively available here as `line`.
    i++;
  }
  lineLengths["longest"] = Math.max(...Object.values(lineLengths));
  return lineLengths;
}

function transformLine(line, lineLengths, name) {
  const difference = lineLengths.longest - line.length;
  let newLine = line;
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

async function parseInputFile(data) {
  const lineLengths = await calcLineLengths();
  const inputStream = fs.createReadStream(__inputFile);
  const outputStream = fs.createWriteStream(__outputFile, { encoding: "utf8" });

  const readlines = readline.createInterface({
    input: inputStream,
    crlfDelay: Infinity,
    output: outputStream
  });
  // Note: we use the crlfDelay option to recognize all instances of CR LF
  // ('\r\n') in input.txt as a single line break.

  let foundTodoList = 0;
  let i = 1;
  const regexp = new RegExp("\"(\d{1,4})\": \d+,?");
  for await (const line of readlines) {
    let inputLine = line;
    let outputLine = "";
    if (!line.toLowerCase.includes("todolist")) {
      readlines.write(line);
    }
    if (foundTodoList === 0 && line.toLowerCase.includes("todolist")) {
      foundTodoList = i;
      readlines.write(line);
    }
    const matched = line.match(regexp);
    if (foundTodoList !== 0) {
      if (line.toLowerCase.includes("},")) {
        foundTodoList = -1;
      } else if ((new RegExp("\"\d{1,4}\": \d+,?")).test(line)) {

        outputLine = transformLine(line, lineLengths, data.find(x => x.id === matched[1]).singular);
        readlines.write(outputLine);
        console.log(`Line from file: ${inputLine} => ${outputLine}`);
      }
    }
    // Each line in input.txt will be successively available here as `line`.
    i++;
  }

  readlines.close();
}

async function run() {
  if (!fsExists(__config)) {
    console.error({ message: `Config, ${__config} does not exist.` });
    return;
  }

  let config;

  try {
    config = await fs.readFile(__config, { encoding: "utf-8" });
  } catch (error) {
    console.error({ message: error.message, stack: error.stack });
  }

  // - Possibly going to be unused code.
  // config = JSON.parse(stripJsonComments(config));
  config = JSON.parse(config);
  out = path.join(__dirname, config.output);
  apiKey = config.credentials.apiKey;
  let json = {};

  if (!fsExists(out)) {
    let gotten = [];
    try {
      gotten = await getString(apiKey);
    } catch (error) {
      console.error({ message: error.message, stack: error.stack });
    }

    try {
      json = { data: gotten };
      json = JSON.stringify(json, null, 2);
    } catch (error) {
      console.error({ message: error.message, stack: error.stack });
    }

    try {
      await fs.writeFile(out, json, { encoding: "utf-8", flag: "w", mode: 0o666 });
    } catch (error) {
      console.error({ message: error.message, stack: error.stack });
    }
  } else {
    try {
      const dataFile = fs.readFile(out, "r+");
      json = JSON.parse(dataFile);
    } catch (error) {
      console.error({ message: error.message, stack: error.stack });
    }
  }

  await parseInputFile(json.data);
}

run();
