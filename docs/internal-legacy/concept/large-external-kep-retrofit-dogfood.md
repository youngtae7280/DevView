# Large External KEP Retrofit Dogfood

Status: read-only-kep-intent-recovery / symbol-anchor-expanded / instruction-pack-ready / no external mutation

## Purpose

This dogfood checks whether PBE can recover intent from a large external project's formal design process before any
target code change is attempted.

The selected project is Kubernetes because it has a large production codebase and a formal KEP process where feature
intent, goals, non-goals, risks, test plans, and rollout strategy are documented separately from the implementation.

## Selected KEP

| Field                 | Value                                                                                                 |
| --------------------- | ----------------------------------------------------------------------------------------------------- |
| KEP                   | `KEP-753: Sidecar containers`                                                                         |
| KEP repo              | `https://github.com/kubernetes/enhancements`                                                          |
| KEP path              | `keps/sig-node/753-sidecar-containers/README.md`                                                      |
| KEP observed ref      | `481e3710995d9996e27c7364b14d9ab870b65e74`                                                            |
| Code repo             | `https://github.com/kubernetes/kubernetes`                                                            |
| Code observed ref     | `2846ba9cdbbde11f02435cfdfccf1850d99be47b`                                                            |
| PBE fixture           | `examples/internal-legacy/retrofit/open-source/kubernetes-sidecar-kep/graph-source.json`              |
| Source map            | `examples/internal-legacy/retrofit/open-source/kubernetes-sidecar-kep/support/kep753-source-map.json` |
| Selected record       | `change.kep753.sidecar-intent-map`                                                                    |
| External repo mutated | no                                                                                                    |

## What Was Recovered

The fixture maps these KEP intent surfaces:

- product intent: sidecar containers as restartable init containers that run through Pod lifecycle;
- goals: first-class sidecar pattern support, Job completion behavior, initContainer/sidecar startup choreography,
  injection support, longer-running sidecars;
- non-goals: arbitrary dependency graphs, sidecar security enforcement, sidecar-specific privilege separation, and
  unapproved termination ordering semantics;
- risks: misuse as regular containers, long-running or never-ready sidecars, lifecycle/termination hazards;
- verification surfaces: unit and e2e lifecycle tests;
- rollout/upgrade boundary: the fixture records rollout relevance but does not claim Kubernetes upgrade/downgrade
  validation.

## Related Kubernetes Surfaces

The first pass intentionally kept the related-code map compact. The second pass keeps the same read-only boundary but
adds exact KEP section, code symbol, and test anchors so PBE can connect intent to implementation more precisely before
any selected target change.

| Surface                                                    | Role                                                                |
| ---------------------------------------------------------- | ------------------------------------------------------------------- |
| `pkg/api/v1/pod/util.go`                                   | restartable init-container helper surface                           |
| `pkg/kubelet/kuberuntime/kuberuntime_container.go`         | kubelet lifecycle/action computation surface                        |
| `pkg/kubelet/kuberuntime/kuberuntime_container_test.go`    | kubelet runtime unit-test surface                                   |
| `pkg/api/v1/pod/util_test.go`                              | pod utility unit-test surface                                       |
| `pkg/api/v1/resource/helpers.go`                           | candidate resource-accounting surface                               |
| `staging/src/k8s.io/component-helpers/resource/helpers.go` | resource aggregation surface with the KEP sidecar formula reference |
| `test/e2e_node/container_lifecycle_test.go`                | node e2e lifecycle surface for restartable init/sidecar behavior    |

## Symbol And Test Anchors

The source map now records exact anchors including:

- KEP sections: `Goals`, `Non-Goals`, `Risks and Mitigations`, resource calculation, test plan, upgrade/downgrade, and
  version skew strategy;
- code symbols: `IsRestartableInitContainer`, `IsContainerRestartable`, `ContainerShouldRestart`,
  `computeInitContainerActions`, `HasAnyRegularContainerCreated`, `AggregateContainerRequests`, and
  `GetResourceRequestQuantity`;
- test anchors: `TestIsContainerRestartable`, `TestContainerHasRestartablePolicy`,
  `TestLifeCycleHookForRestartableInitContainer`, and restartable init-container node e2e scenarios.

These anchors are still Evidence for PBE retrofit analysis. They do not claim Kubernetes test execution or maintainer
approval.

## Verification

The committed fixture is covered locally by:

```bash
npx vitest run cli/src/__tests__/graph-retrofit.test.ts
```

The test verifies:

- `graph retrofit plan` can summarize the KEP retrofit graph-source;
- edgeIntent claim/classification coverage has no missing entries;
- forbidden boundaries are visible;
- the record is implementation-ready for read-only analysis;
- `graph operation generate-pack` can produce a read-only instruction pack;
- the instruction pack does not authorize external project mutation.

## Boundaries

This pass does not:

- clone or mutate `kubernetes/kubernetes`;
- clone or mutate `kubernetes/enhancements`;
- run Kubernetes build, unit, integration, conformance, or e2e suites;
- claim Kubernetes maintainer intent or acceptance;
- create an upstream issue or PR;
- enroll Kubernetes in positive read-model `validate --all`;
- expand PBE source authority, CI enforcement, or required checks.

## Scaling Path

Recommended next scaling order:

1. Keep this KEP graph under observation with exact code/test symbol anchors from the pinned Kubernetes refs.
2. Add one more KEP fixture from another subsystem and verify the same graph shape generalizes.
3. Only after those pass, select a tiny docs-only or test-only local change with explicit allowed files and forbidden
   flows.
4. Defer real Kubernetes code changes until the target checkout, build/test cost, and review boundaries are explicit.
