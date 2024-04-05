# This is an experimental image for development
# NOT for deployment

FROM node:latest

# For PNPM
# https://pnpm.io/docker
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Current Working Directory
WORKDIR /la

# Install bun
RUN curl -fsSL https://bun.sh/install | bash

# Install edgedb
# -y flag is used to skip the confirmation prompt
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.edgedb.com | sh -s -- -y
# edgedb doesn't add the binary to the PATH, so we need to add it manually
ENV PATH="$PATH:/root/.local/bin"

# Install grafbase
RUN pnpm add -g grafbase

# Copy package.json and pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# Install dependencies. Dependencies will be cached if the package.json and pnpm-lock.yaml files are not changed
RUN pnpm install

# Copy the rest of the source code
COPY . .
