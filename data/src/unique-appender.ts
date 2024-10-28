import fs from 'fs/promises';
import readline from 'readline';
import { createReadStream } from 'fs';

export class UniqueLineAppender {
  filePath: string;
  similarityThreshold: number;
  cache: Set<string>;
  isInitialized: boolean;
  constructor(filePath: string, similarityThreshold = 0.8) {
    this.filePath = filePath;
    this.similarityThreshold = similarityThreshold;
    this.cache = new Set(); // Cache để lưu các dòng đã đọc
    this.isInitialized = false;
  }

  // Tính toán độ tương đồng giữa 2 chuỗi using Levenshtein Distance
  calculateSimilarity(str1: string, str2: string) {
    if (str1.length > str2.length) {
      [str1, str2] = [str2, str1];
    }

    const distances = Array(str1.length + 1)
      .fill(null)
      .map(() => Array(str2.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i += 1) {
      distances[i][0] = i;
    }
    for (let j = 0; j <= str2.length; j += 1) {
      distances[0][j] = j;
    }

    for (let i = 1; i <= str1.length; i += 1) {
      for (let j = 1; j <= str2.length; j += 1) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        distances[i][j] = Math.min(
          distances[i - 1][j] + 1,
          distances[i][j - 1] + 1,
          distances[i - 1][j - 1] + cost
        );
      }
    }

    const maxLength = Math.max(str1.length, str2.length);
    return 1 - distances[str1.length][str2.length] / maxLength;
  }

  // Khởi tạo cache bằng cách đọc file hiện có
  async initialize() {
    try {
      // Tạo file nếu chưa tồn tại
      try {
        await fs.access(this.filePath);
      } catch {
        await fs.writeFile(this.filePath, '');
      }

      const fileStream = createReadStream(this.filePath);
      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
      });

      for await (const line of rl) {
        if (line.trim()) {
          this.cache.add(line);
        }
      }

      this.isInitialized = true;
      console.log(`Initialized with ${this.cache.size} lines from file`);
    } catch (error) {
      console.error('Error initializing cache:', error);
      throw error;
    }
  }

  // Kiểm tra xem một dòng có tương tự với bất kỳ dòng nào trong cache không
  isSimilarToExisting(newLine: string) {
    for (const existingLine of this.cache) {
      const similarity = this.calculateSimilarity(newLine, existingLine);
      if (similarity >= this.similarityThreshold) {
        return {
          isSimilar: true,
          similarTo: existingLine,
          similarity: similarity,
        };
      }
    }
    return { isSimilar: false };
  }

  // Thêm dòng mới nếu không tương tự với các dòng hiện có
  async appendLine(newLine: string) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    newLine = newLine.trim();
    if (!newLine) {
      return {
        success: false,
        reason: 'Empty line',
      };
    }

    const similarityCheck = this.isSimilarToExisting(newLine);
    if (similarityCheck.isSimilar) {
      return {
        success: false,
        reason: 'Similar line exists',
        similarity: similarityCheck.similarity,
        similarTo: similarityCheck.similarTo,
      };
    }

    try {
      await fs.appendFile(this.filePath, newLine + '\n');
      this.cache.add(newLine);
      return {
        success: true,
        message: 'Line appended successfully',
      };
    } catch (error) {
      return {
        success: false,
        reason: 'Error appending to file',
        error,
      };
    }
  }

  // Xóa cache và đọc lại file
  async refresh() {
    this.cache.clear();
    this.isInitialized = false;
    await this.initialize();
  }

  // Lấy số lượng dòng hiện có
  getLineCount() {
    return this.cache.size;
  }
}


