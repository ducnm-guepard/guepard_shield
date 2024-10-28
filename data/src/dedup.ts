import * as fs from 'fs';
import * as readline from 'readline';

const sameSequence = (line: string) => (otherLine: string) => {
  const seq1 = line.substring(0, line.lastIndexOf(','));
  const seq2 = otherLine.substring(0, otherLine.lastIndexOf(','));
  return seq1 === seq2;
}

async function removeDuplicateLines(
  inputPath: string,
  outputPath: string
): Promise<void> {
  const uniqueLines: string[] = [];
  let totalLines = 0;
  let uniqueLinesCount = 0;

  // Create read stream and readline interface
  const fileStream = fs.createReadStream(inputPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  // Process the file line by line
  for await (const line of rl) {
    totalLines++;
    if (!uniqueLines.some(sameSequence(line))) {
      uniqueLines.push(line);
      uniqueLinesCount++;
    }
  }

  // Write unique lines to output file
  const writeStream = fs.createWriteStream(outputPath);
  for (const line of uniqueLines) {
    writeStream.write(line + '\n');
  }

  // Close the write stream
  await new Promise<void>((resolve) => {
    writeStream.end(() => resolve());
  });

  console.log(`Processing complete:
    - Total lines processed: ${totalLines}
    - Unique lines: ${uniqueLinesCount}
    - Duplicates removed: ${totalLines - uniqueLinesCount}`);
}

// Example usage
const inputFile = 'syscall/log.csv';
const outputFile = 'syscall/log-distinct.csv';

removeDuplicateLines(inputFile, outputFile)
  .then(() => console.log('File processing completed successfully!'))
  .catch((error) => console.error('Error processing file:', error));
