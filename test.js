var assert = require("assert");
const fs = require("fs");
const parse = require("csv-parse/lib/sync");
const importEnrolleeCsv = require("./import-enrollee-csv");

const rmDir = function(dirPath, removeSelf) {
  if (removeSelf === undefined) removeSelf = true;
  try {
    var files = fs.readdirSync(dirPath);
  } catch (e) {
    return;
  }
  if (files.length > 0)
    for (var i = 0; i < files.length; i++) {
      var filePath = dirPath + "/" + files[i];
      if (fs.statSync(filePath).isFile()) fs.unlinkSync(filePath);
      else rmDir(filePath);
    }
  if (removeSelf) fs.rmdirSync(dirPath);
};
describe("A CSV file with only correct headers is accepted", () => {
  it("should return an array of names for files that were generated", () => {
    rmDir("out", false);
    let generatedFileNames = [];
    try {
      generatedFileNames = importEnrolleeCsv("./mocks/MOCK_DATA.csv", "out");
    } catch (err) {
      // Do nothing
    }
    assert.equal(generatedFileNames.length > 0, true);
  });
  it("should separate enrollees by insurance company in its own file", () => {
    rmDir("out", false);
    const rawInData = fs.readFileSync("./mocks/MOCK_DATA.csv");
    const inData = parse(rawInData, { columns: true });

    let outFileNames = "";
    try {
      // I chose this file because it only has one user with multiple versions
      outFileNames = importEnrolleeCsv("./mocks/MOCK_DATA.csv", "out").sort();
    } catch (err) {
      // Do nothing
    }

    const expectedInsuranceCompanyFiles = Array.from(
      new Set(
        inData.map(
          e =>
            "out/" +
            e["Insurance Company"].replace(/[^a-z0-9]/gi, "_").toLowerCase() +
            ".csv"
        )
      )
    ).sort();

    assert.deepStrictEqual(expectedInsuranceCompanyFiles, outFileNames);
  });
  describe("If there are duplicate User Ids for the same Insurance Company", () => {
    it("only the record with the highest version should be included", () => {
      rmDir("out", false);
      const rawInData = fs.readFileSync("./mocks/MOCK_DATA_USER_VERSIONS.csv");
      const inData = parse(rawInData, { columns: true });

      let outFileName = "";
      try {
        // I chose this file because it only has one user with multiple versions
        outFileName = importEnrolleeCsv(
          "./mocks/MOCK_DATA_USER_VERSIONS.csv",
          "out"
        )[0];
      } catch (err) {
        // Do nothing
      }

      const rawOutData = fs.readFileSync(outFileName, "utf-8");
      const enrollmentData = parse(rawOutData, { columns: false });

      assert.equal(
        Number.parseInt(enrollmentData[0][2]),
        Math.max(...inData.map(e => Number.parseInt(e["Version"])))
      );
    });
  });
});
describe("A CSV file with additional headers is accepted", () => {
  it("should return an array of names for files that were generated", () => {
    rmDir("out", false);
    let generatedFileNames = [];
    try {
      generatedFileNames = importEnrolleeCsv(
        "./mocks/MOCK_DATA_ADDITIONAL_COL.csv",
        "out"
      );
    } catch (err) {
      // Do nothing
    }
    assert.equal(generatedFileNames.length > 0, true);
  });
});
describe("A CSV file with a missing header is not accepted", () => {
  it("should throw an error", () => {
    let error = "";
    try {
      importEnrolleeCsv("./mocks/MOCK_DATA_MISSING_COL.csv", "out");
    } catch (err) {
      error = err.message;
    }
    assert.equal(
      error,
      "The file does not include the correct headers in its first line"
    );
  });
});
