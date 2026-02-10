"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDirectory = createDirectory;
exports.writeFile = writeFile;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
async function createDirectory(dirPath) {
    if (await fs_extra_1.default.pathExists(dirPath)) {
        return true;
    }
    await fs_extra_1.default.ensureDir(dirPath);
    return false;
}
async function writeFile(filePath, content) {
    await fs_extra_1.default.ensureDir(path_1.default.dirname(filePath));
    await fs_extra_1.default.writeFile(filePath, content, 'utf-8');
}
