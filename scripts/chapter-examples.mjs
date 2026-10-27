// Copyright © 2026 Christopher Snow.
// Same displayed source and download wrapper as the book; CPU validation selects CPU.
import {testedPythonExamples} from '../src/desktop-catalog.mjs';
import {pythonProgram} from '../src/desktop-program.mjs';
process.stdout.write(JSON.stringify(testedPythonExamples().map(example=>({...example,program:pythonProgram(example.source)}))));
