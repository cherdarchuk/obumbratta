// Be sure to `npm install` each of the imported packages before running this script.

import fs from "fs";
import archieml from "archieml";
import fetch from "node-fetch";

const docs = [
	{
		"id": "1LmJ50mgkjDUqAq44faZrn6mRkmmORSTi8swsyqHMynw",
		"filepath": "./src/data/text.json"
	},
]

const CWD = process.cwd();

const fetchGoogle = async ({ id, gid }) => {
  console.log(`fetching...${id}`);

  const base = "https://docs.google.com";
  const post = gid ? `spreadsheets/u/1/d/${id}/export?format=csv&id=${id}&gid=${gid}` : `document/d/${id}/export?format=txt`;
  const url = `${base}/${post}`;
  console.log(url);

  try {
    const response = await fetch(url);
    const text = await response.text();

    if (gid) return text;

    const parsed = archieml.load(text);
    const str = JSON.stringify(parsed, null, 2);
    return str;

  } catch (err) {
    throw new Error(err);
  }
};

(async () => {
  for (let d of docs) {
    try {
      const str = await fetchGoogle(d);
      const file = `${CWD}/${d.filepath}`;
      fs.writeFileSync(file, str);
    } catch (err) {
      console.log(err);
    }
  }
})();