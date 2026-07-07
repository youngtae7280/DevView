# Ambiguity Gate

PBE must not turn vague intent into executable work. Ambiguity Gate is the RPD checkpoint that decides whether a user
request is ready to become a confirmed Product Tree node.

## Identity

PBE is not an execution engine that tries to do everything. PBE is a requirements-based execution control layer for
AI-assisted development.

The gate protects this sequence:

```text
user intent -> Product Tree -> Project/Work Tree -> Test Tree -> Evidence -> user acceptance
```

## Abstract Quality Terms

Requests containing terms such as these are not executable by themselves:

```text
clean
nice
fast
intuitive
stable
easy to use
modern
efficient
flexible
scalable
problem-free
깔끔하게
보기 좋게
빠르게
안정적으로
사용하기 쉽게
직관적으로
현대적으로
효율적으로
유연하게
확장 가능하게
문제 없게
```

Preserve the user intent, but mark the Product node candidate as `needs_clarification` until the intent becomes
verifiable.

## Checklist

1. Target: which screen, feature, module, user flow, API, or behavior is affected?
2. Condition: when does this requirement apply?
3. Expected behavior: what should the system do, and is it observable?
4. Completion criteria: how do we know it is complete?
5. Exception handling: what happens on failure, empty state, timeout, denied permission, or missing data?
6. Verification method: what test, screenshot, log, manual scenario, diff, or evidence proves it?

## Results

`CLEAR`: enough information exists to write EARS acceptance criteria and propose confirmation.

`PARTIAL`: useful intent exists, but one or two critical slots are missing. Ask one focused question.

`AMBIGUOUS`: the request is too abstract to execute. Record the candidate and stop before WPD.

## Hard Rule

Ambiguous or partial Product nodes must not derive selected or foundation Work Tree nodes. Work may start only after
ambiguity is resolved into acceptance criteria or the item is deferred, blocked, or out of scope.
