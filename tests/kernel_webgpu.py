# Copyright © 2026 Christopher Snow.
"""Compile and dispatch real WGSL through Chromium's software WebGPU adapter."""
import os
from pathlib import Path
import subprocess
import time
from urllib.request import urlopen
from playwright.sync_api import sync_playwright, expect
from version_check import mock_version

ROOT = Path(__file__).resolve().parents[1]
URL = 'http://127.0.0.1:5188/gpu-lab/'
server = subprocess.Popen(['node', 'scripts/serve.mjs', '--dist'], cwd=ROOT, env={**os.environ, 'PORT': '5188'}, stdout=subprocess.DEVNULL)
try:
    for attempt in range(60):
        try:
            urlopen(URL, timeout=1).close()
            break
        except OSError:
            time.sleep(.1)
    with sync_playwright() as p:
        options = {'args': ['--enable-unsafe-webgpu', '--use-angle=swiftshader']}
        if os.environ.get('CHROMIUM_PATH'):
            options['executable_path'] = os.environ['CHROMIUM_PATH']
        browser = p.chromium.launch(**options)
        context = browser.new_context()
        mock_version(context)
        page = context.new_page()
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto(URL + 'lessons/kernel.html')
        page.locator('#run-gpu').click()
        expect(page.locator('#kernel-status')).to_contain_text('WebGPU: 0 of 3', timeout=30000)
        expect(page.locator('#gpu-output-panel')).to_be_visible()
        expect(page.locator('#kernel-gpu-output .kernel-cell').first).to_contain_text('—')
        context.set_offline(True)
        page.locator('#kernel-index').select_option('global')
        page.locator('#run-gpu').click()
        expect(page.locator('#kernel-status')).to_contain_text('WebGPU: 3 of 3', timeout=30000)
        expect(page.locator('#gpu-adapter')).to_contain_text('software/fallback')
        page.get_by_role('button', name='Inspect 35', exact=True).click()
        expect(page.locator('#kernel-gpu-output .kernel-cell')).to_have_count(35)
        expect(page.locator('#kernel-gpu-output .kernel-cell').last).to_contain_text('35')
        cases = page.evaluate('''async () => {
          const {runWebGPU} = await import('../src/kernel-webgpu.mjs');
          const {simulateKernel,inputFor} = await import('../src/kernel-model.mjs');
          let checked = 0;
          for (const workgroupSize of [8,16,32,64]) for (const index of ['global','next','local']) for (const guard of [true,false]) for (const operation of ['multiply','add','vector-add']) {
            const program = {index,guard,operation,workgroupSize,task:operation==='vector-add'?'vector-add':'scale'};
            const inputs = [0,1,8,32,35,65].map(inputFor);
            const gpu = await runWebGPU(program,inputs);
            for (const [j,input] of inputs.entries()) {
              const model = simulateKernel(program,input), actual = gpu.results[j];
              if (!model.safe) {
                if (!actual.blocked) throw new Error('Unsafe case dispatched');
              } else {
                if (actual.passed !== model.passed) throw new Error('Verdict differs');
                const values = actual.output.map(v=>Number.isNaN(v)?null:v);
                if (JSON.stringify(values)!==JSON.stringify(model.output)) throw new Error('Read-back differs');
              }
              checked++;
            }
          }
          return checked;
        }''')
        assert cases == 432
        page.locator('#kernel-index').select_option('local')
        page.locator('#run-gpu').click()
        expect(page.locator('#kernel-status')).to_contain_text('WebGPU: 2 of 3', timeout=30000)
        expect(page.locator('#kernel-cases')).to_contain_text('Not dispatched')
        assert not errors, errors
        context.close()
        browser.close()
        print('PASS: actual WGSL compilation/dispatch/read-back on SwiftShader; 432 model/WebGPU cases and unsafe-dispatch prevention')
finally:
    server.terminate()
    server.wait(timeout=5)
