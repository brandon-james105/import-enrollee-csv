const importEnrolleeCsv = require("./import-enrollee-csv");

let fileName = process.argv[2],
  outFolder = process.argv[3];

if (fileName != undefined) {
  try {
    const generatedFiles = importEnrolleeCsv(fileName, outFolder);
    console.log("These files were written to the disk: ");
    console.log(generatedFiles.join("\n"));
  } catch (err) {
    console.error(err.message);
  }
} else {
  console.log("No csv file path was given.");
}
