import { z } from "zod";

const ReleaseRepositorySchema = z.object({ name: z.string().min(1), gitSha: z.string().min(1) }).strict();
const ReleasePackageSchema = z
  .object({
    name: z.enum(["@machinesroom/contracts", "@machinesroom/api-client"]),
    version: z.string().regex(/^\d+\.\d+\.\d+$/),
    distTag: z.string().min(1),
    integrity: z.string().min(1),
    provenanceVerified: z.boolean(),
    publicationStatus: z.enum(["source_build", "published_verified"])
  })
  .strict();

export const AgentReleaseManifestSchema = z
  .object({
    schemaVersion: z.literal(1),
    docsVersion: z.string().min(1),
    builtAt: z.string().datetime(),
    mainRepository: ReleaseRepositorySchema,
    sdkMirrorRepository: ReleaseRepositorySchema,
    packages: z.array(ReleasePackageSchema).length(2),
    contractChecksums: z.record(z.string().regex(/^sha256:[a-f0-9]{64}$/)),
    compatibility: z.object({ sdkRange: z.string().min(1), node: z.string().min(1) }).strict()
  })
  .strict();

export type AgentReleaseManifest = z.infer<typeof AgentReleaseManifestSchema>;

