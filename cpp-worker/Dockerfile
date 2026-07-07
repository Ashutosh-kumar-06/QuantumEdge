FROM python:3.10-slim

# Install C++ compiler, CMake, and curl
RUN apt-get update && apt-get install -y g++ cmake curl tar docker.io

WORKDIR /app

# Download QuEST v3.5.0 (stable release tarball — avoids branch-name guessing)
RUN curl -fSL https://github.com/QuEST-Kit/QuEST/archive/refs/tags/v3.5.0.tar.gz -o quest.tar.gz && \
    tar -xzf quest.tar.gz && \
    mv QuEST-* /QuEST && \
    rm quest.tar.gz

RUN cd /QuEST && mkdir build && cd build && cmake .. && make

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
CMD ["python", "worker.py"]
