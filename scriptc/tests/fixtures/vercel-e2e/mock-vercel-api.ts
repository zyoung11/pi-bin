/* The local mock api.vercel.com the vercel e2e suite drives both lanes
 * against: the endpoints the CLI's read-only commands hit when pointed at
 * `--api http://127.0.0.1:PORT` with a token in VERCEL_TOKEN. Every shape
 * below was RECORDED from vercel 56.2.0 (dist/index.js under Node) against
 * a logging loopback server inside the network jail — the CLI never
 * reached vercel.com. Everything is DETERMINISTIC: fixed ids, fixed
 * timestamps (age columns are normalized by the harness anyway — they are
 * rendered relative to "now" on both lanes).
 *
 * Recorded request shapes (vercel 56.2.0; every request carries
 * `authorization: Bearer <token>`, `user-agent: vercel 56.2.0 node-v… os (arch)`,
 * and random per-invocation `x-vercel-cli-session-id` / `x-vercel-cli-invocation-id`):
 *   whoami       GET /v2/user, GET /teams/:defaultTeamId?teamId=:id
 *   teams ls     GET /v2/user, GET /v2/teams?limit=20
 *   teams switch GET /v2/user, GET /v1/teams (the switch itself only writes the local global-config)
 *   ls           GET /v2/user, GET /teams/:id?teamId=:id, GET /v6/deployments?limit=20&teamId=:id
 *   project ls   GET /v2/user, GET /teams/:id?teamId=:id, GET /v9/projects?limit=20&teamId=:id
 *   project add  GET /v2/user, POST /v1/projects {name}, GET /teams/:id?teamId=:id
 *   domains ls   GET /v2/user, GET /teams/:id?teamId=:id, GET /v5/domains?limit=20&teamId=:id
 *   domains inspect  GET /v2/user, GET /teams/:id?teamId=:id, then GET /v4/domains/:name racing
 *                GET /v1/registrar/domains/:name/price (404 tolerated), then
 *                GET /v1/domains/:name/project-domains?limit=100, per assignment GET /v9/projects/:id,
 *                GET /v4/domains/:name/config
 *   dns ls       GET /v2/user, GET /teams/:id?teamId=:id, GET /v5/domains?limit=20&teamId=:id,
 *                then per domain GET /v3/domains/:name/records?limit=20&teamId=:id
 *   dns add      GET /v2/user, GET /teams/:id?teamId=:id, POST /v3/domains/:name/records {name,type,value}
 *   dns rm       GET /v2/user, GET /teams/:id?teamId=:id, GET /v5/domains/records/:id,
 *                DELETE /v3/domains/:domain/records/:id
 *   alias ls     GET /v2/user, GET /teams/:id?teamId=:id, GET /v3/now/aliases?limit=20&teamId=:id
 *   alias set    GET /v2/user, GET /teams/:id?teamId=:id, POST /now/deployments/:idOrUrl/aliases {alias}
 *   alias rm     GET /v2/user, GET /teams/:id?teamId=:id, GET /now/aliases/:alias, DELETE /now/aliases/:uid
 *   certs ls     GET /v2/user, GET /v4/certs?limit=20 (no team scoping in 56.2.0)
 *   inspect      GET /v2/user, GET /teams/:id?teamId=:id, GET /v13/deployments/:idOrHost,
 *                then (version 2) GET /v11/deployments/:id/builds
 *   logs         GET /v2/user, GET /teams/:id?teamId=:id, GET /v13/deployments/:idOrHost,
 *                GET /v9/projects/:projectId, GET /api/logs/request-logs?…startDate=…&endDate=…
 *                (epochs from --since/--until; without them they are wall-clock "now")
 *   env ls/add/rm  GET /v2/user, GET /teams/:id (via the .vercel/project.json link),
 *                GET /v9/projects/:linkedId, GET /v10/projects/:id/env?source=vercel-cli:env:…
 *                racing GET /projects/:id/custom-environments, then for add
 *                POST /v10/projects/:id/env {type,key,value,target} / for rm
 *                DELETE /v10/projects/:id/env/:envId
 *
 * The server records every request; the harness asserts the misses stay
 * empty (an unknown route answers 404 AND lands in `unexpected`), so a
 * drifted endpoint fails loudly instead of silently rendering an empty
 * table. */
import { createServer, type Server } from "node:http";

/** Fixed identities. northstar + defaultTeamId makes the CLI resolve the
 * default team on most commands — the recorded two-request preamble. */
const USER = {
  id: "usr_mock00000000000000000001",
  email: "mock@example.com",
  username: "mockuser",
  name: "Mock User",
  version: "northstar",
  defaultTeamId: "team_mock0000000000000001",
};

const TEAM = {
  id: "team_mock0000000000000001",
  slug: "mock-team",
  name: "Mock Team",
  creatorId: USER.id,
  created: "2024-01-01T00:00:00.000Z",
  createdAt: 1704067200000,
  membership: { role: "OWNER", confirmed: true, created: 1704067200000, createdAt: 1704067200000 },
};

const SECOND_TEAM = {
  id: "team_mock0000000000000002",
  slug: "second-team",
  name: "Second Team",
  creatorId: USER.id,
  created: "2024-02-01T00:00:00.000Z",
  createdAt: 1706745600000,
  membership: { role: "MEMBER", confirmed: true, created: 1706745600000, createdAt: 1706745600000 },
};

const DEPLOYMENTS = [
  {
    uid: "dpl_mock0000000000000000000000000001",
    name: "mock-app",
    url: "mock-app-abc123defg-mock-team.vercel.app",
    created: 1704153600000,
    createdAt: 1704153600000,
    state: "READY",
    readyState: "READY",
    ready: 1704153660000,
    type: "LAMBDAS",
    creator: { uid: USER.id, email: USER.email, username: USER.username },
    target: "production",
    inspectorUrl: "https://vercel.com/mock-team/mock-app/mock000000000001",
    meta: {},
    buildingAt: 1704153610000,
    proposedExpiration: null,
  },
  {
    uid: "dpl_mock0000000000000000000000000002",
    name: "mock-app",
    url: "mock-app-hij456klmn-mock-team.vercel.app",
    created: 1704067200000,
    createdAt: 1704067200000,
    state: "ERROR",
    readyState: "ERROR",
    type: "LAMBDAS",
    creator: { uid: USER.id, email: USER.email, username: USER.username },
    target: null,
    inspectorUrl: "https://vercel.com/mock-team/mock-app/mock000000000002",
    meta: {},
    buildingAt: 1704067210000,
    proposedExpiration: null,
  },
];

const PROJECTS = [
  {
    id: "prj_mock000000000000000000000001",
    name: "mock-app",
    accountId: TEAM.id,
    createdAt: 1704067200000,
    updatedAt: 1704153600000,
    framework: "nextjs",
    devCommand: null,
    buildCommand: null,
    outputDirectory: null,
    rootDirectory: null,
    latestDeployments: [DEPLOYMENTS[0]],
    targets: { production: DEPLOYMENTS[0] },
    nodeVersion: "22.x",
    live: false,
  },
  {
    id: "prj_mock000000000000000000000002",
    name: "static-site",
    accountId: TEAM.id,
    createdAt: 1706745600000,
    updatedAt: 1706745600000,
    framework: null,
    devCommand: null,
    buildCommand: null,
    outputDirectory: null,
    rootDirectory: null,
    latestDeployments: [],
    targets: {},
    nodeVersion: "22.x",
    live: false,
  },
];

const DOMAINS = [
  {
    id: "dmn_mock0000000000000000000001",
    name: "mock-example.com",
    serviceType: "external",
    nsVerifiedAt: null,
    txtVerifiedAt: null,
    cdnEnabled: false,
    createdAt: 1704067200000,
    expiresAt: null,
    boughtAt: null,
    verified: true,
    nameservers: ["ns1.example-dns.com", "ns2.example-dns.com"],
    intendedNameservers: ["ns1.vercel-dns.com", "ns2.vercel-dns.com"],
    creator: { id: USER.id, username: USER.username, email: USER.email },
  },
];

const DNS_RECORDS = [
  {
    id: "rec_mock0000000000000000000001",
    slug: "mock-example.com-a",
    name: "",
    type: "A",
    value: "76.76.21.21",
    creator: "system",
    created: 1704067200000,
    createdAt: 1704067200000,
    updated: 1704067200000,
    updatedAt: 1704067200000,
  },
  {
    id: "rec_mock0000000000000000000002",
    slug: "mock-example.com-cname-www",
    name: "www",
    type: "CNAME",
    value: "cname.vercel-dns.com",
    creator: USER.id,
    created: 1704070800000,
    createdAt: 1704070800000,
    updated: 1704070800000,
    updatedAt: 1704070800000,
  },
];

const ALIASES = [
  {
    uid: "ali_mock0000000000000000000001",
    alias: "mock-app.vercel.app",
    created: "2024-01-02T00:01:00.000Z",
    createdAt: 1704153660000,
    deployment: { id: DEPLOYMENTS[0]!.uid, url: DEPLOYMENTS[0]!.url },
    deploymentId: DEPLOYMENTS[0]!.uid,
    projectId: PROJECTS[0]!.id,
    creator: { uid: USER.id, username: USER.username, email: USER.email },
  },
  {
    uid: "ali_mock0000000000000000000002",
    alias: "mock-example.com",
    created: "2024-01-02T00:02:00.000Z",
    createdAt: 1704153720000,
    deployment: { id: DEPLOYMENTS[0]!.uid, url: DEPLOYMENTS[0]!.url },
    deploymentId: DEPLOYMENTS[0]!.uid,
    projectId: PROJECTS[0]!.id,
    creator: { uid: USER.id, username: USER.username, email: USER.email },
  },
];

/** The full v13 single-deployment shape (`inspect`/`logs` resolve
 * deployments here; the v6 list shape above is what `ls` renders). */
const DEPLOYMENT_V13 = {
  id: DEPLOYMENTS[0]!.uid,
  name: "mock-app",
  url: DEPLOYMENTS[0]!.url,
  version: 2,
  target: "production",
  createdAt: 1704153600000,
  buildingAt: 1704153610000,
  ready: 1704153660000,
  readyState: "READY",
  status: "READY",
  alias: ["mock-app.vercel.app", "mock-example.com"],
  aliasAssigned: true,
  creator: { uid: USER.id, username: USER.username },
  regions: ["iad1"],
  meta: {},
  routes: null,
  plan: "pro",
  public: false,
  projectId: PROJECTS[0]!.id,
  ownerId: TEAM.id,
  inspectorUrl: "https://vercel.com/mock-team/mock-app/mock000000000001",
};

const BUILDS_V11 = [
  {
    id: "bld_mock00000000000000000000001",
    deploymentId: DEPLOYMENT_V13.id,
    entrypoint: "package.json",
    readyState: "READY",
    createdAt: 1704153610000,
    readyStateAt: 1704153655000,
    output: [
      { type: "lambda", path: "api/index", size: 1048576, lambda: { deployedTo: ["iad1"] } },
      { type: "file", path: "index.html", size: 2048 },
    ],
  },
];

/** Request-log rows for `logs` (the /api/logs/request-logs shape: rows
 * with per-request `logs` entries and `events` carrying the source). */
const REQUEST_LOG_ROWS = [
  {
    requestId: "req_mock000000000000000000001",
    timestamp: 1704153700000,
    deploymentId: DEPLOYMENT_V13.id,
    domain: "mock-app.vercel.app",
    requestMethod: "GET",
    requestPath: "/",
    statusCode: 200,
    environment: "production",
    events: [{ source: "static" }],
    logs: [],
  },
  {
    requestId: "req_mock000000000000000000002",
    timestamp: 1704153710000,
    deploymentId: DEPLOYMENT_V13.id,
    domain: "mock-app.vercel.app",
    requestMethod: "GET",
    requestPath: "/api/data",
    statusCode: 500,
    environment: "production",
    events: [{ source: "serverless" }],
    logs: [{ level: "error", message: "TypeError: Cannot read properties of undefined (reading 'rows')" }],
  },
  {
    requestId: "req_mock000000000000000000003",
    timestamp: 1704153720000,
    deploymentId: DEPLOYMENT_V13.id,
    domain: "mock-app.vercel.app",
    requestMethod: "POST",
    requestPath: "/api/submit",
    statusCode: 202,
    environment: "production",
    events: [{ source: "serverless" }],
    logs: [{ level: "warning", message: "payload missing optional field \"tags\"" }],
  },
];

const ENVS = [
  {
    id: "env_mock0000000000000000000001",
    key: "DATABASE_URL",
    value: "",
    type: "encrypted",
    target: ["production", "preview", "development"],
    configurationId: null,
    createdAt: 1704067200000,
    updatedAt: 1704067200000,
    createdBy: USER.id,
    updatedBy: null,
  },
  {
    id: "env_mock0000000000000000000002",
    key: "NEXT_PUBLIC_BASE_URL",
    value: "https://mock-example.com",
    type: "plain",
    target: ["production"],
    configurationId: null,
    createdAt: 1704070800000,
    updatedAt: 1704070800000,
    createdBy: USER.id,
    updatedBy: null,
  },
  {
    id: "env_mock0000000000000000000003",
    key: "PREVIEW_FLAG",
    value: "",
    type: "encrypted",
    target: ["preview"],
    gitBranch: "staging",
    configurationId: null,
    createdAt: 1704074400000,
    updatedAt: 1704074400000,
    createdBy: USER.id,
    updatedBy: null,
  },
];

const CERTS = [
  {
    uid: "cert_mock000000000000000000001",
    cns: ["mock-example.com", "*.mock-example.com"],
    created: "2024-01-01T00:00:00.000Z",
    createdAt: 1704067200000,
    expiration: "2024-04-01T00:00:00.000Z",
    expirationDate: "2024-04-01T00:00:00.000Z",
    autoRenew: true,
  },
];

const PAGINATED = (extra: Record<string, unknown>): unknown => ({
  ...extra,
  pagination: { count: Object.values(extra)[0] instanceof Array ? (Object.values(extra)[0] as unknown[]).length : 0, next: null, prev: null },
});

/** What the harness's linked-project lanes write into .vercel/project.json:
 * the CLI resolves this pair before any env command's requests. */
export const MOCK_PROJECT_LINK = { projectId: PROJECTS[0]!.id, orgId: TEAM.id };

export interface RecordedRequest {
  method: string;
  path: string;
  search: string;
  authorization: string | undefined;
  /** The raw request body (mutations) — pinned in the endpoint traces so
   * both lanes must SEND identical payloads, not just hit identical URLs. */
  body: string;
}

export async function startMockVercelApi(): Promise<{
  server: Server;
  baseUrl: string;
  requests: RecordedRequest[];
  /** Requests that fell through to the 404 arm — endpoint drift. */
  unexpected: RecordedRequest[];
}> {
  const requests: RecordedRequest[] = [];
  const unexpected: RecordedRequest[] = [];
  const server = createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on("data", (c: Buffer) => chunks.push(c));
    req.on("end", () => {
      const u = new URL(req.url ?? "/", "http://mock");
      const rec: RecordedRequest = {
        method: req.method ?? "?",
        path: u.pathname,
        search: u.search,
        authorization: typeof req.headers.authorization === "string" ? req.headers.authorization : undefined,
        body: Buffer.concat(chunks).toString("utf8"),
      };
      requests.push(rec);
      const json = (status: number, payload: unknown): void => {
        res.writeHead(status, { "content-type": "application/json" });
        res.end(JSON.stringify(payload));
      };
      // Tokens are per-child (`mockfaketoken<suffix>`, no dashes — the CLI
      // rejects tokens containing "-" before any request); anything else
      // answers the API's 403 shape, driving the CLI's invalid-token path.
      if (!/^Bearer mockfaketoken/.test(rec.authorization ?? "")) {
        return json(403, { error: { code: "forbidden", message: "Not authorized" } });
      }
      switch (`${rec.method} ${u.pathname}`) {
        case "GET /v2/user":
          return json(200, { user: USER });
        case `GET /teams/${TEAM.id}`:
        case `GET /v2/teams/${TEAM.id}`:
          return json(200, TEAM);
        case "GET /v2/teams":
        case "GET /v1/teams":
          return json(200, PAGINATED({ teams: [TEAM, SECOND_TEAM] }));
        case "GET /v6/deployments":
          return json(200, PAGINATED({ deployments: DEPLOYMENTS }));
        case `GET /v13/deployments/${DEPLOYMENT_V13.url}`:
        case `GET /v13/deployments/${DEPLOYMENT_V13.id}`:
          return json(200, DEPLOYMENT_V13);
        case `GET /v11/deployments/${DEPLOYMENT_V13.id}/builds`:
          return json(200, { builds: BUILDS_V11 });
        case "GET /api/logs/request-logs":
          return json(200, { rows: REQUEST_LOG_ROWS, hasMoreRows: false });
        case "GET /v9/projects":
          return json(200, PAGINATED({ projects: PROJECTS }));
        case `GET /v9/projects/${PROJECTS[0]!.id}`:
          return json(200, PROJECTS[0]);
        case `GET /v10/projects/${PROJECTS[0]!.id}/env`: {
          const target = u.searchParams.get("target");
          return json(200, { envs: target === null ? ENVS : ENVS.filter((e) => e.target.includes(target)) });
        }
        case `GET /projects/${PROJECTS[0]!.id}/custom-environments`:
          return json(200, { environments: [] });
        case `POST /v10/projects/${PROJECTS[0]!.id}/env`:
          return json(200, { created: [], failed: [] });
        case "POST /v1/projects":
          return json(200, {
            id: "prj_mock000000000000000000000new",
            name: JSON.parse(rec.body === "" ? "{}" : rec.body).name ?? "unnamed",
            accountId: TEAM.id,
            createdAt: 1704240000000,
            updatedAt: 1704240000000,
          });
        case `DELETE /v10/projects/${PROJECTS[0]!.id}/env/${ENVS[1]!.id}`:
          return json(200, {});
        case "GET /v5/domains":
          return json(200, PAGINATED({ domains: DOMAINS }));
        case `GET /v4/domains/${DOMAINS[0]!.name}`:
          return json(200, { domain: DOMAINS[0] });
        // domains inspect races a registrar price lookup; the mock owns no
        // registrar, and the CLI treats any failure as "no price" (the
        // domain was not bought through Vercel: boughtAt is null).
        case `GET /v1/registrar/domains/${DOMAINS[0]!.name}/price`:
          return json(404, { error: { code: "not_found", message: "price unavailable" } });
        case `GET /v1/domains/${DOMAINS[0]!.name}/project-domains`:
          return json(200, PAGINATED({ projectDomains: [{ projectId: PROJECTS[0]!.id, name: DOMAINS[0]!.name }] }));
        case `GET /v4/domains/${DOMAINS[0]!.name}/config`:
          return json(200, { configuredBy: "http", nameservers: DOMAINS[0]!.nameservers, serviceType: "external", cnames: [], aValues: ["76.76.21.21"], conflicts: [], acceptedChallenges: ["http-01"], misconfigured: false });
        case `GET /v3/domains/${DOMAINS[0]!.name}/records`:
          return json(200, PAGINATED({ records: DNS_RECORDS }));
        case `POST /v3/domains/${DOMAINS[0]!.name}/records`:
          return json(200, { uid: "rec_mock000000000000000000new1", updated: 1 });
        case `GET /v5/domains/records/${DNS_RECORDS[1]!.id}`:
          return json(200, { ...DNS_RECORDS[1], domain: DOMAINS[0]!.name });
        case `DELETE /v3/domains/${DOMAINS[0]!.name}/records/${DNS_RECORDS[1]!.id}`:
          return json(200, {});
        case "GET /v3/now/aliases":
          return json(200, PAGINATED({ aliases: ALIASES }));
        case `GET /now/aliases/${ALIASES[0]!.alias}`:
          return json(200, ALIASES[0]);
        case `DELETE /now/aliases/${ALIASES[0]!.uid}`:
          return json(200, {});
        case `POST /now/deployments/${DEPLOYMENT_V13.url}/aliases`:
          return json(200, { uid: "ali_mock000000000000000000new1", alias: JSON.parse(rec.body === "" ? "{}" : rec.body).alias ?? "unknown" });
        case "GET /v4/certs":
          return json(200, PAGINATED({ certs: CERTS }));
        default:
          unexpected.push(rec);
          return json(404, { error: { code: "not_found", message: `mock has no route ${u.pathname}` } });
      }
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const addr = server.address();
  if (addr === null || typeof addr !== "object") throw new Error("no mock vercel api address");
  return { server, baseUrl: `http://127.0.0.1:${addr.port}`, requests, unexpected };
}
