import * as child_process from "node:child_process"
import * as path from "node:path"
import * as graphstate from "@nothing-but/graphstate"

import { $ } from "bun"
import Watcher from "watcher"

const filename  = new URL(import.meta.url).pathname
const root_path = path.dirname(filename)
const api_path  = path.join(root_path, "api")


async function main() {
	const args = Bun.argv
	const command = args[2]
	switch (command) {
		// fully sets up LA for development (website, desktop, mobile, api, ..)
		case "setup":
			await setupEnvFiles()
			await setupFloxWithDependencies()
			await setupEdgeDb()
			await setupCursor()
			break
		case "run":
			await run()
			break
		case "grafbase":
			await runGrafbase()
			break
		case "graphql":
			generate_graphql_client()
			break
		case undefined:
			// TODO: move to https://github.com/nikitavoloboev/ts/blob/main/cli/cli.ts
			console.log("No command provided")
			break
		default:
			console.log("Unknown command")
			break
	}
}

// creates necessary .env files and fills it with default values to run LA locally
async function setupEnvFiles() {
	// TODO: check that `.env` files are already present
	const currentFilePath = import.meta.path
	const grafbaseEnvPath = `${currentFilePath.replace("cmd.ts", "grafbase/.env")}`
	const grfabaseEnvfileExists = await Bun.file(grafbaseEnvPath).exists()
	if (!grfabaseEnvfileExists) {
		Bun.write(
			grafbaseEnvPath,
			`LOCAL=true
EDGEDB_DSN=
PUBLIC_HANKO_API_URL=https://e879ccc9-285e-49d3-b37e-b569f0db4035.hanko.io
INTERNAL_SECRET=secret`,
		)
	} else {
		console.log(`File: ${grafbaseEnvPath} already exists`)
	}
	const grafbaseEdgedbEnvPath = `${currentFilePath.replace("cmd.ts", "grafbase/edgedb/.env")}`
	const grafbaseEdgedbEnvFileExists = await Bun.file(grafbaseEdgedbEnvPath).exists()
	if (!grafbaseEdgedbEnvFileExists) {
		Bun.write(
			grafbaseEdgedbEnvPath,
			`LOCAL=true
GRAFBASE_URL=http://127.0.0.1:4000/graphql
GRAFBASE_INTERNAL_SECRET=secret
LOCAL_USER_HANKO_ID=
wikiFolderPath=
email=`,
		)
	} else {
		console.log(`File: ${grafbaseEdgedbEnvPath} already exists`)
	}

	const websiteEnvFilePath = `${currentFilePath.replace("cmd.ts", "website/.env")}`
	const websiteEnvFileExists = await Bun.file(websiteEnvFilePath).exists()
	if (!websiteEnvFileExists) {
		Bun.write(
			websiteEnvFilePath,
			`VITE_HANKO_API=https://e879ccc9-285e-49d3-b37e-b569f0db4035.hanko.io
VITE_GRAFBASE_API_URL=http://127.0.0.1:4000/graphql
VITE_GRAFBASE_INTERNAL_SECRET=secret`,
		)
	} else {
		console.log(`File: ${websiteEnvFilePath} already exists`)
	}
	console.log(".env files created")
}

const graphql_client_header = `/*

This file is generated by \`bun graphql\` command. Do not edit it manually.
To regenerate this file, run \`bun graphql\`.

*/\n\n`

/**
 * Generates a GraphQL client based on the schema from grafbase.
 */
async function generate_graphql_client() {
	const schema = child_process
		.execSync("grafbase introspect --dev", {cwd: api_path})
		.toString()
	Bun.write("shared/graphql_schema.gql", schema)

	const queries = await graphstate.wasm_generate_queries(schema)
	if (queries instanceof Error) {
		console.error(queries)
		return
	}
	Bun.write("shared/graphql_queries.js", graphql_client_header + queries)
}

async function runGrafbase() {
	await generate_graphql_client()

	// rerun graphql client generation on changes in grafbase folder
	const currentFilePath = import.meta.url.replace("file://", "")
	const grafbaseWatchPath = `${currentFilePath.replace("cmd.ts", "api/grafbase")}`
	const watcher = new Watcher(grafbaseWatchPath, { recursive: true })
	watcher.on("change", async (event) => {
		if (event.includes("grafbase.config.ts")) {
			await generate_graphql_client()
		}
	})

	// doing > /dev/stdout to get colored output on linux/mac at least, context: https://discord.com/channels/876711213126520882/876711213126520885/1221521173813268581
	const res = await $`cd api && grafbase dev > /dev/stdout`
	console.log(res)
}

// TODO: maybe have a way to setup full learn-anything workspace in Cursor for users
// it would create `learn-anything` folder somewhere where user specifies
// then inside it would clone these repos into it:
// https://github.com/learn-anything/learn-anything.xyz
// https://github.com/learn-anything/tasks
// https://github.com/learn-anything/explore
// https://github.com/learn-anything/docs
// and then it would create a `learn-anything.code-workspace` file
// where it will include `learn-anything.xyz` folder by default with others commented out
// docs can say that users can add other repos to the workspace file if they want by uncommenting
// below command should automate all of the above
// error checking and proper logging of what happened with links to docs to be included
// async function getFullMonorepo() {
//   await $`git clone https://github.com/learn-anything/tasks`
//   await $`git clone https://github.com/learn-anything/docs`
// }

// check https://flox.dev is installed, if not, propose to install it, then rerun `bun run init`
// if not possible to automate installing `flox.dev` on behalf of user
// after flox is installed, setup env with all the dependencies with https://flox.dev
async function setupFloxWithDependencies() {
	// TODO: check that flox is installed
	// TODO: check that flox is setup correctly with all the deps
}

// fully automated way to setup EdgeDB locally with all the necessary data
// taken from files in https://github.com/learn-anything/docs/tree/main/data/seed
async function setupEdgeDb() {
	// TODO: check that edgedb is installed, if not, ask user to setup https://flox.dev
	// TODO: most likely need to run `getFullMonorepo` so docs repo is available
}

// reccomend to use Cursor as editor and setup it with necessary plugins (Biome) + set it as default formatter
async function setupCursor() {
	// TODO:
}

async function run() {
	// can use this function to quickly run/test out TS code in scope of project (quick experiments)
	// can run it with `bun ts`
	// only commit functions/commands that are useful to the project
}

main()
