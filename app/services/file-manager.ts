import { Service } from 'services/service';
import path from 'path';
import fs from 'fs';

interface IFile {
  data: string;
  locked: boolean;
  version: number;
  dirty: boolean;
}

/**
 * This service provides an atomic, race-condition-free
 * file I/O system.  It supports instaneous synchronous
 * reads and writes of files under management.  It does
 * this by storing a copy of all files in memory, and
 * asynchronously flushing them to disk.  This obviously
 * has the downside of being memory intensive, and should
 * only be used for small files where atomicity and
 * performance are important.
 */
export class FileManagerService extends Service {
  private files: Dictionary<IFile> = {};

  async exists(filePath: string): Promise<boolean> {
    const truePath = path.resolve(filePath);

    if (this.files[truePath]) return Promise.resolve(true);
    return this.fileExists(truePath);
  }

  write(filePath: string, data: string) {
    const truePath = path.resolve(filePath);
    const file = this.files[truePath];

    if (file) {
      file.data = data;
      file.version += 1;
      file.dirty = true;
    } else {
      this.files[truePath] = {
        data,
        locked: false,
        version: 0,
        dirty: true
      };
    }

    this.flush(truePath);
  }

  read(filePath: string) {
    const truePath = path.resolve(filePath);
    let file = this.files[truePath];

    // If this is the first read of this file, do a blocking synchronous read
    if (!file) {
      file = this.files[truePath] = {
        data: fs.readFileSync(truePath).toString(),
        locked: false,
        version: 0,
        dirty: false
      };
    }

    return file.data;
  }

  copy(sourcePath: string, destPath: string) {
    const trueSource = path.resolve(sourcePath);
    const trueDest = path.resolve(destPath);

    this.files[trueDest] = {
      data: this.read(trueSource),
      locked: false,
      version: 0,
      dirty: true
    };

    this.flush(trueDest);
  }

  /**
   * Ensures that all dirty files have been flushed.  Should only
   * be called before shutdown.
   */
  async flushAll() {
    const promises = Object.keys(this.files).filter(filePath => {
      return this.files[filePath].dirty;
    })
    .map(filePath => {
      return this.flush(filePath);
    });

    await promises;
  }

  private async flush(filePath: string, tries = 10) {
    const file = this.files[filePath];

    // Current flush attempt will realize it wrote out
    // of date data and re-run.
    if (file.locked) return;

    file.locked = true;
    const version = file.version;

    try {
      await this.writeFile(filePath, file.data);

      if (version !== file.version) {
        throw new Error('Wrote out of date file!  Will retry...');
      }

      file.locked = false;
      file.dirty = false;
      console.debug(`Wrote file ${filePath} version ${version}`);
    } catch (e) {
      if (tries > 0) {
        file.locked = false;
        await this.flush(filePath, tries - 1);
      } else {
        console.error(`Ran out of retries writing ${filePath}`);
      }
    }
  }

  /**
   * Checks if a file exists
   * @param string a path to the file
   */
  private fileExists(filePath: string): Promise<boolean> {
    return new Promise(resolve => {
      fs.exists(filePath, exists => resolve(exists));
    });
  }

  /**
   * Writes data to a file
   * @param filePath a path to the file
   * @param data The data to write
   */
  private writeFile(filePath: string, data: string): Promise<void> {
    return new Promise((resolve, reject) => {
      fs.writeFile(filePath, data, err => {
        if (err) {
          reject(err);
          return;
        }

        resolve();
      });
    });
  }
}