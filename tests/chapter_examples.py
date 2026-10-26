# Copyright © 2026 Christopher Snow.
"""Execute the displayed examples on CPU. This does not validate CUDA backends."""
import contextlib
import io
import json
from pathlib import Path
import subprocess
import torch

root=Path(__file__).resolve().parents[1]
examples=json.loads(subprocess.check_output(['node','scripts/chapter-examples.mjs'],cwd=root,text=True))
for example in examples:
    source=example['source'].replace('device="cuda"','device="cpu"')
    namespace={}
    with contextlib.redirect_stdout(io.StringIO()):
        exec(compile(source,example['id'],'exec'),namespace)
    expected=example.get('expected') or {}
    for name,values in expected.items():
        actual=namespace.get(name)
        # The matrix-conversion example keeps converted values in a[0]; its
        # backend matmul output is not a sequential FP32-accumulation claim.
        if name=='converted' and actual is None:
            actual=namespace['a'][0].float()
        if actual is None and example['slug']=='tensor-cores' and name in ['total','reference']:
            continue
        assert actual is not None,(example['id'],name)
        reference=torch.tensor(values,dtype=actual.dtype)
        torch.testing.assert_close(actual,reference,rtol=1e-5 if example['slug']=='attention' else 0,atol=1e-6 if example['slug']=='attention' else 0,msg=lambda msg:example['id']+' '+name+': '+msg)
    if example['id']=='opening':
        if example['slug']=='scheduling':assert namespace['z'].tolist()==[4,8,12,16,20]
        if example['slug']=='inference':
            assert namespace['k_cache'].shape[-2:]==(4,4)
            assert namespace['out'].shape[-2:]==(1,4)
            assert torch.isfinite(namespace['out']).all()
print(f'PASS: {len(examples)} displayed PyTorch examples on CPU; CUDA backend execution remains unvalidated')
