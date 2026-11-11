# /// script
# requires-python = ">=3.10,<3.13"
# dependencies = ["playwright==1.58.0", "numpy", "soundfile"]
# ///
# Copyright © 2026 Christopher Snow.
"""Export model-derived slides and pre-generated Kokoro sentence cues.

First run render-<chapter>-recording.mjs and record-demo's tts.py (see that
chapter's media README). This script needs those audio files; ordinary course builds never run TTS.
"""
import json
import os
from pathlib import Path
import shutil
import subprocess
import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from threading import Thread

import numpy as np
import soundfile as sf
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('chapter',choices=['reduction','matmul','devices'],nargs='?',default='reduction')
parser.add_argument('--slides-only',action='store_true',help='Export slide frames and PDF for review before encoding')
args=parser.parse_args()
chapter=args.chapter
title={'reduction':'Shared memory and barriers','matmul':'How matrix tiles reuse inputs','devices':'Follow tensor values between CPU and GPU'}[chapter]
WORK = ROOT / f'test-results/{chapter}-recording'
DEST = ROOT / f'assets/media/{chapter}'
DEST.mkdir(parents=True, exist_ok=True)
scenes = json.loads((ROOT / f'content/{chapter}-scenes.json').read_text())
slides = WORK / 'slides'
slides.mkdir(parents=True,exist_ok=True)
subprocess.run(['node', f'scripts/render-{chapter}-recording.mjs', str(WORK)], cwd=ROOT, check=True)
server=ThreadingHTTPServer(('127.0.0.1',0),partial(SimpleHTTPRequestHandler,directory=str(ROOT)))
Thread(target=server.serve_forever,daemon=True).start()
with sync_playwright() as p:
    executable = os.environ.get('CHROMIUM_PATH') or shutil.which('chromium') or shutil.which('chromium-browser')
    browser = p.chromium.launch(headless=True, **({'executable_path': executable} if executable else {}))
    page = browser.new_page(viewport={'width': 1280, 'height': 720}, device_scale_factor=3)
    page.goto(f'http://127.0.0.1:{server.server_port}/test-results/{chapter}-recording/deck.html')
    page.evaluate('document.fonts.ready')
    for scene in scenes:
        slide = page.locator('#' + scene['id'])
        assert slide.evaluate('el=>el.scrollHeight<=el.clientHeight'), scene['id']
        slide.screenshot(path=str(slides / (scene['id'] + '.png')), animations='disabled')
    page.pdf(path=str(DEST / 'slides.pdf'), print_background=True, prefer_css_page_size=True)
    browser.close()
server.shutdown();server.server_close()
if args.slides_only:
    print(f'Exported {len(scenes)} slide frames and PDF for review',flush=True)
    raise SystemExit(0)
speech = json.loads((WORK / 'audio/durations.json').read_text())

def stamp(t, srt=False):
    ms = round(t * 1000)
    return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02}{"," if srt else "."}{ms%1000:03}'

sr = 24000
pieces, vtt, srt, cuts, segments = [], ['WEBVTT', ''], [], [], []
cursor = 0
metadata = [';FFMETADATA1', 'title='+title, 'artist=GPU Lab']
for scene in scenes:
    start = cursor
    lead = np.zeros(round(.6 * sr), dtype=np.float32)
    pieces.append(lead)
    cursor += len(lead) / sr
    for i, text in enumerate(scene['captions'], 1):
        cue_id = f'{scene["id"]}-c{i}'
        audio, source_sr = sf.read(WORK / 'audio' / (cue_id + '.wav'), dtype='float32')
        assert source_sr == sr and np.isfinite(audio).all() and np.max(np.abs(audio)) < 1
        end = cursor + len(audio) / sr
        vtt += [f'{stamp(cursor)} --> {stamp(end)}', text, '']
        srt += [str(len(segments) + 1), f'{stamp(cursor,True)} --> {stamp(end,True)}', text, '']
        segments.append({'id': cue_id, 'start': round(cursor,3), 'end': round(end,3), 'text': text})
        pieces.append(audio)
        gap = np.zeros(round(.22 * sr), dtype=np.float32)
        pieces.append(gap)
        cursor = end + len(gap) / sr
    hold = np.zeros(round(scene.get('hold', 1.2) * sr), dtype=np.float32)
    pieces.append(hold)
    cursor += len(hold) / sr
    cuts.append({'id':scene['id'], 'start':round(start,3), 'end':round(cursor,3), 'title':scene['title']})
    metadata += ['[CHAPTER]', 'TIMEBASE=1/1000', f'START={round(start*1000)}', f'END={round(cursor*1000)}', 'title='+scene['title']]
sf.write(WORK / 'narration.wav', np.concatenate(pieces), sr, subtype='PCM_24')
(DEST / 'captions.vtt').write_text('\n'.join(vtt))
(WORK / 'captions.srt').write_text('\n'.join(srt))
(WORK / 'chapters.txt').write_text('\n'.join(metadata))
concat = []
for cut in cuts:
    concat += [f"file '{slides / (cut['id'] + '.png')}'", f"duration {cut['end']-cut['start']:.3f}"]
concat += [f"file '{slides / (cuts[-1]['id'] + '.png')}'"]
(WORK / 'frames.txt').write_text('\n'.join(concat))
video = DEST / f'{chapter}.mp4'
subprocess.run([
    'ffmpeg','-y','-loglevel','warning','-f','concat','-safe','0','-i',str(WORK/'frames.txt'),
    '-i',str(WORK/'narration.wav'),'-i',str(WORK/'captions.srt'),'-i',str(WORK/'chapters.txt'),
    '-map','0:v','-map','1:a','-map','2:s','-map_metadata','3','-map_chapters','3',
    '-vf','fps=30,format=yuv420p','-c:v','libx264','-preset',os.environ.get('DEMO_FFMPEG_PRESET','veryfast'),'-threads',os.environ.get('DEMO_FFMPEG_THREADS','4'),'-crf','18','-tune','stillimage',
    '-af','loudnorm=I=-16:TP=-1.5:LRA=11','-ar','48000','-c:a','aac','-b:a','160k',
    '-c:s','mov_text','-metadata:s:s:0','language=eng','-movflags','+faststart','-t',str(round(cursor,3)),str(video)
],check=True)
subprocess.run(['ffmpeg','-y','-loglevel','error','-i',str(slides/'s01.png'),'-vf','scale=1920:1080','-frames:v','1',str(DEST/'poster.jpg')],check=True)
info = json.loads(subprocess.check_output(['ffprobe','-v','error','-show_format','-show_streams','-of','json',str(video)]))
duration = float(info['format']['duration'])
manifest = {'durationSeconds':round(duration), 'bytes':video.stat().st_size, 'scenes':cuts, 'cues':segments, 'speech':speech}
(ROOT/f'content/{chapter}-media.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(f'Exported {len(cuts)} slides, {len(segments)} exact audio cues; {duration:.2f}s; {video.stat().st_size} bytes',flush=True)
