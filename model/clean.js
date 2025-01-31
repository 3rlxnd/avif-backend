const fs = require("fs");

function removeOutputDirectories() {
  const outputsPath = "./public/outputs";

  fs.readdir(outputsPath, (err, files) => {
    if (err) {
      console.error('Error reading "outputs" directory:', err);
      return;
    }

    files.forEach((file) => {
      const dirPath = `${outputsPath}/${file}`;

      fs.stat(dirPath, (err, stats) => {
        if (err) {
          console.error(`Error getting stats for directory "${dirPath}":`, err);
          return;
        }

        if (
          stats.isDirectory() &&
          isDirectoryOlderThan1Hour(stats.birthtimeMs)
        ) {
          fs.rm(dirPath, { recursive: true }, (err) => {
            if (err) {
              console.error(`Error removing directory "${dirPath}":`, err);
            } else {
              console.log(`Directory "${dirPath}" removed successfully.`);
            }
          });
        }
      });
    });
  });
}

function isDirectoryOlderThan1Hour(directoryBirthtimeMs) {
  const oneHourInMillis = 60 * 60 * 1000;
  const currentTimestamp = Date.now();
  const elapsedTimeInMillis = currentTimestamp - directoryBirthtimeMs;
  return elapsedTimeInMillis > oneHourInMillis;
}

// Call the function every hour
setInterval(removeOutputDirectories, 5 * 60 * 1000);
