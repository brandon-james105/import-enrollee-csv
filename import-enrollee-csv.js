const fs = require("fs");
const parse = require("csv-parse/lib/sync");
const stringify = require("csv-stringify/lib/sync");

const headers = ["User Id", "Full Name", "Version", "Insurance Company"];

const importEnrolleeCsv = function(filePath, outputFolder) {
  if (outputFolder == undefined) {
    outputFolder = "";
  }
  if (outputFolder.endsWith("/")) {
    outputFolder.slice(0, outputFolder.lastIndexOf("/"));
  }
  const rawEnrollmentData = fs.readFileSync(filePath, "utf-8");

  // Organize the data while reading it
  return generateFilesFromRawEnrollmentData(rawEnrollmentData, outputFolder);
};

function generateFilesFromRawEnrollmentData(rawEnrollmentData, outputFolder) {
  const output = parse(rawEnrollmentData, { columns: true });

  if (output.length === 0) {
    return [];
  }

  if (!containsAllHeaders(output, headers)) {
    throw new Error(
      "The file does not include the correct headers in its first line"
    );
  }

  // Remove duplicates the ES6 way
  const insuranceCompanies = Array.from(
    new Set(output.map(e => e["Insurance Company"]))
  );

  return generateFilesFromInsuranceCompanies(
    insuranceCompanies,
    output,
    outputFolder
  );
}

// Map all the enrollment information by company
function generateFilesFromInsuranceCompanies(
  insuranceCompanies,
  enrollees,
  outputFolder
) {
  return insuranceCompanies.map(company => {
    let enrolleesToIdMap = {};
    // Set up a map of company employee ids to employee data, where employee data is overridden if the version is higher
    enrollees
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

    // Sort the company enrollees by full name
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
    fs.writeFileSync(`${outputFolder}/${fileName}`, csvData);
    return `${outputFolder}/${fileName}`;
  });
}

function containsAllHeaders(output, headers) {
  return (
    Object.keys(output[0]).filter(hs => {
      return headers.some(h => {
        return hs.indexOf(h) > -1;
      });
    }).length === headers.length
  );
}

module.exports = importEnrolleeCsv;

return module.exports;
