const importEnrolleeCsv = require("./import-enrollee-csv");

if (process.argv[2] != undefined) {
  const generatedFiles = importEnrolleeCsv(process.argv[2], process.argv[3]);
  console.log("These files were written to the disk: ");
  console.log(generatedFiles.join("\n"));
} else {
  console.log("No csv file path was given.");
}
