const fs = require("fs");
const parse = require("csv-parse/lib/sync");
const stringify = require("csv-stringify/lib/sync");

const importEnrolleeCsv = function(filePath, outputFolder) {
  if (outputFolder == undefined) {
    outputFolder = "";
  }
  if (outputFolder.endsWith("/")) {
    outputFolder.slice(0, outputFolder.lastIndexOf("/"));
  }
  const headers = ["User Id", "Full Name", "Version", "Insurance Company"];
  const rawEnrollmentData = fs.readFileSync(filePath, "utf-8");
  let generatedFiles = [];

  // Organize the data while reading it
  const output = parse(rawEnrollmentData, { columns: true });

  if (output.length === 0) {
    return [];
  }
  var containsAllHeaders =
    Object.keys(output[0]).filter(hs => {
      return headers.some(h => {
        return hs.indexOf(h) > -1;
      });
    }).length === headers.length;

  if (!containsAllHeaders) {
    throw "The file does not include the correct headers in its first line";
  }

  // Remove duplicates the ES6 way
  const insuranceCompanies = Array.from(
    new Set(output.map(e => e["Insurance Company"]))
  );
  // Map all the enrollment information by company
  insuranceCompanies.forEach(company => {
    let enrolleesToIdMap = {};
    output
      .filter(e => e["Insurance Company"] == company)
      .forEach(e => {
        const currentId = e["User Id"];
        let userStoredAtCurrentId = enrolleesToIdMap[currentId];
        if (enrolleesToIdMap[currentId] != undefined) {
          if (e["Version"] > userStoredAtCurrentId["Version"]) {
            enrolleesToIdMap[currentId] = e;
          }
        } else {
          enrolleesToIdMap[currentId] = e;
        }
      });

    const companyEnrollees = Object.keys(enrolleesToIdMap)
      .map(id => {
        const currentEnrollee = enrolleesToIdMap[id];
        let outEnrollee = {};
        headers.forEach(header => {
          outEnrollee[header] = currentEnrollee[header];
        });
        return outEnrollee;
      })
      .sort((a, b) => {
        const aName = a["Full Name"];
        const bName = b["Full Name"];
        if (aName === bName) {
          return 0;
        }
        return aName > bName ? 1 : -1;
      });
    const csvData = stringify(companyEnrollees);
    const fileName = company.replace(/[^a-z0-9]/gi, "_").toLowerCase() + ".csv";
    generatedFiles.push(`${outputFolder}/${fileName}`);
    fs.writeFileSync(`${outputFolder}/${fileName}`, csvData);
  });
  return generatedFiles;
};

module.exports = importEnrolleeCsv;

return module.exports;
