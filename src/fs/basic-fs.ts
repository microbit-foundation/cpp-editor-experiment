import EventEmitter from "events";
import sortBy from "lodash.sortby";
import { fromByteArray, toByteArray } from "base64-js";

import {
    FileSystem,
    Project,
    VersionedData,
    VersionAction,
    EVENT_PROJECT_UPDATED,
    EVENT_TEXT_EDIT,
    Statistics,
} from "./fs";
import { generateId } from './fs-util';
import { FSStorage } from "./storage";
import { Host } from "./host";
import { Logging } from "../logging/logging";
import { ProjectFiles } from "./initial-project";
import { lineNumFromUint8Array } from "../common/text-util";

export const MAIN_FILE = "main.cpp";

export class BasicFileSystem extends EventEmitter implements FileSystem {
    project: Project;
    private storage: FSStorage;
    private _dirty: boolean = false;
    private fileVersions: Map<string, number> = new Map();

    constructor(
        private logging: Logging,
        private host: Host,
    ) {
        super();
        this.storage = host.createStorage(logging);
        this.project = {
            files: [],
            id: generateId(),
            name: undefined,
        };
    }

    /**
   * We remember this so we can tell whether the user has edited
   * the project since for stats generation.
   */
    private cachedInitialProject: ProjectFiles | undefined;

    async initialize() {
        this._dirty = await this.storage.isDirty();
        if (await this.host.shouldReinitializeProject(this.storage)) {
            // Do this ASAP to unblock the editor.
            this.cachedInitialProject = await this.host.createInitialProject();
            if (this.cachedInitialProject.projectName) {
              await this.setProjectName(this.cachedInitialProject.projectName);
            }
            for (const key in this.cachedInitialProject.files) {
              const content = toByteArray(this.cachedInitialProject.files[key]);
              await this.write(key, content, VersionAction.INCREMENT);
            }
            this.host.notifyReady(this);
        } else {
            await this.notify();
        }
    }

    async getProjectFiles(): Promise<ProjectFiles> {
        const projectName = await this.storage.projectName();
        const project: ProjectFiles = {
        files: {},
        projectName,
        };

        for (const file of await this.storage.ls()) {
        const data = await this.storage.read(file);
        const contentAsBase64 = fromByteArray(data);
         project.files[file] = contentAsBase64;
        }
        return project;
    }

    async replaceWithProjectFiles(project: ProjectFiles): Promise<void> {
        this.project.files.forEach((f) => this.remove(f.name));
        
        for (const key in project.files) {
            const content = toByteArray(project.files[key]);
            await this.write(key, content, VersionAction.INCREMENT);
        }

        await this.replaceCommon(project.projectName);
    }

    //might not be used for now since we don't load cpp projects from hex
    replaceWithHexContents(projectName: string, hex: string): Promise<void> {
        throw new Error("Method not implemented.");
    }

    private async replaceCommon(projectName?: string): Promise<void> {
        this.project = {
          ...this.project,
          id: generateId(),
        };
        await this.storage.setProjectName(projectName);
        await this.clearDirty();
        return this.notify();
    }

    get dirty() {
        return this._dirty;
    }

    async setProjectName(projectName: string): Promise<void> {
        await this.storage.setProjectName(projectName);
        await this.markDirty();
        return this.notify();
    }

    async read(filename: string): Promise<VersionedData> {
        const versionedData : VersionedData = {
            data: await this.storage.read(filename),
            version: this.fileVersion(filename),
        };

        return versionedData;
    }

    async exists(filename: string): Promise<boolean> {
        return this.storage.exists(filename);
    }

    async write(filename: string, content: string | Uint8Array, versionAction: VersionAction): Promise<void> {
        if (typeof content === "string") {
            content = new TextEncoder().encode(content);
          }
          await this.storage.write(filename, content);

          if (versionAction === VersionAction.INCREMENT) {
            this.incrementFileVersion(filename);
            return this.notify();
          } else {
            this.emit(EVENT_TEXT_EDIT);
            // Nothing can have changed, don't needlessly change the identity of our file objects.
            return this.markDirty();
          }
    }

    async remove(filename: string): Promise<void> {
        await this.storage.remove(filename);
        return this.notify();
    }

    async files(): Promise<Record<string, Uint8Array>> {
        const names = await this.storage.ls();
        return Object.fromEntries(
          await Promise.all(
            names.map(async (name) => [name, (await this.read(name)).data])
          )
        );
    }

    async statistics(): Promise<Statistics> {
        const currentMainFile = await this.storage.read(MAIN_FILE);
        const files = await this.storage.ls();
        let numMagicModules = 0;

        const lines = 
            this.cachedInitialProject &&
            this.cachedInitialProject.files[MAIN_FILE] === fromByteArray(currentMainFile)
                ? undefined
                : lineNumFromUint8Array(currentMainFile)

        const statistics: Statistics = {
            lines,
            files: files.length,
            storageUsed: 0,
            magicModules: numMagicModules,
        }

        return statistics;   
    }

    private async notify() {
        const fileNames = await this.storage.ls();
        const projectFiles = fileNames.map((name) => ({
        name,
        version: this.fileVersion(name),
        }));
        const filesSorted = sortBy(
        projectFiles,
        (f) => f.name !== MAIN_FILE,
        (f) => f.name
        );
        this.project = {
        ...this.project,
        name: await this.storage.projectName(),
        files: filesSorted,
        };
        this.emit(EVENT_PROJECT_UPDATED, this.project);
    }

    private async markDirty(): Promise<void> {
        this._dirty = true;
        return this.storage.markDirty();
    }

    async clearDirty(): Promise<void> {
        this._dirty = false;
        return this.storage.clearDirty();
    }

    private fileVersion(filename: string): number {
        const version = this.fileVersions.get(filename);
        if (version === undefined) {
          this.incrementFileVersion(filename);
          return this.fileVersion(filename);
        }
        return version;
      }
    
    private incrementFileVersion(filename: string): void {
        const current = this.fileVersions.get(filename);
        this.fileVersions.set(filename, current === undefined ? 1 : current + 1);
    }
}