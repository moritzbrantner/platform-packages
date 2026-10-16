/** Reject dependencies that exist only inside the platform-packages checkout. */
export function assertPublishableDependencies(pkg) {
  for (const kind of ["dependencies", "optionalDependencies", "peerDependencies"]) {
    for (const [name, spec] of Object.entries(pkg[kind] ?? {})) {
      if (typeof spec === "string" && /^(?:file|link):/.test(spec)) {
        throw new Error(
          `${pkg.name} cannot publish ${name} as ${spec}; replace ${kind}.${name} with an externally resolvable package before release.`,
        );
      }
    }
  }
}
