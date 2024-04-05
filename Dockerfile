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
# Add to PATH for setup step
ENV PATH="$PATH:/root/.bun/bin"

# Install edgedb
# -y flag is used to skip the confirmation prompt
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.edgedb.com | sh -s -- -y
# edgedb doesn't add the binary to the PATH by itself
ENV PATH="$PATH:/root/.local/bin"

# Install grafbase
RUN pnpm add -g grafbase

# Copy pnpm files for installation
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY app/package.json app/
COPY mobile/package.json mobile/
COPY website/package.json website/

# Install dependencies. Dependencies will be cached if the package.json and pnpm-lock.yaml files are not changed
RUN pnpm install

# Copy the rest of the source code
COPY . .

# Setup project
RUN bun setup
