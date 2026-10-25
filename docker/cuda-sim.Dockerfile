# syntax=docker/dockerfile:1
# Same CUDA toolchain and simulator revision for desktop use and CI.
FROM ghcr.io/accel-sim/accel-sim-framework:ubuntu-24.04-cuda-12.8-minimal@sha256:1ae7da75d01d7b1317621c7a8f8b0f507a6e26182232f0ebfc38beb45ed3362d
ARG GPGPUSIM_REV=c3eeb6d19016960ab66789efdd8a3200cc30222a
RUN --mount=type=secret,id=proxy_ca \
    if [ -f /run/secrets/proxy_ca ]; then export GIT_SSL_CAINFO=/run/secrets/proxy_ca; fi; \
    git clone https://github.com/gpgpu-sim/gpgpu-sim_distribution.git /opt/gpgpu-sim && \
    cd /opt/gpgpu-sim && git checkout "$GPGPUSIM_REV" && \
    cmake -B build -DCMAKE_BUILD_TYPE=Release && cmake --build build -j2 && cmake --install build
ENV GPGPUSIM_ROOT=/opt/gpgpu-sim
COPY scripts/run-cuda.sh scripts/verify-cuda-output.py /opt/gpu-lab/
ENTRYPOINT ["bash", "/opt/gpu-lab/run-cuda.sh", "simulator"]
