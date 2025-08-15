// @ts-check
const cheerio = require("cheerio");
const axios = require("axios");
const fs = require("fs");

async function main() {
  const mainHTMLPage = fs.readFileSync("file.html", "utf-8");
  const crystals = getJobNameAndLinkBasedOnCrystal(
    mainHTMLPage,
    "Fire Crystal"
  );
  // console.info("----------");
  // console.info(getJobNameAndLinkBasedOnCrystal(mainHTMLPage, "Ice Crystal"));
  // console.info(splitPer5(laurelPage));

  const csv = [["Job", "Link", "Item", "Zone", "Time", "Coordinate"]];

  for (const crystal of crystals) {
    let row = [...crystal];
    csv.push(row);

    if (crystal[0] === "Fisher") {
      row.push("", "", "");
      continue;
    }

    const htmlPage = await axios(crystal[1]);
    const data = splitPer5(htmlPage.data);

    if (data.length === 0) continue;

    // @ts-ignore
    row.push(...data[0]);
    csv.push(row);

    if (data.length > 1) {
      for (const item of data) {
        row = [...crystal, ...item];
        csv.push(row);
      }
    }
  }

  console.info(csv.map((row) => row.join(",")).join("\n"));
}

main();

//
function splitPer5(rawDocument) {
  const $ = cheerio.load(rawDocument);

  const rawTableColumns = $("td")
    .toArray()
    .map((e) => $(e).text().trim())
    .filter(Boolean);
  const all = [];

  for (let i = 0; i < rawTableColumns.length; i += 5) {
    const sliced = rawTableColumns.slice(i, i + 5);
    all.push([sliced[1].replace(/\s{2,}/g, " "), sliced[3], `"${sliced[4]}"`]);
  }

  return all;
}

function getJobNameAndLinkBasedOnCrystal(rawDocument, crystal) {
  const $ = cheerio.load(rawDocument);

  return $(`[title="${crystal}"]`)
    .toArray()
    .map((node) => {
      const loaded = cheerio
        // @ts-ignore
        .load(node.parent.parent)("td")
        .children("a")
        .toArray()
        .map((e) => e.attribs);

      return [
        loaded[0].title,
        `https://ffxiv.consolegameswiki.com${loaded[1].href}`,
        loaded[1].title,
      ];
    });
}
