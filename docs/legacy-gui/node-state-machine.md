# Node State Machine

## Statuses

- `needs_interview`: the node needs a focused interview.
- `interviewing`: a one-question-at-a-time chat session is active.
- `ready_to_decompose`: enough context has been gathered to create child modules.
- `expanded`: child modules were generated.
- `confirmed_leaf`: the user confirmed this branch should not be decomposed further in RPD.

## Transitions

- Start interview: `needs_interview -> interviewing`
- Submit sufficient answer: `interviewing -> ready_to_decompose`
- Generate child modules: `ready_to_decompose -> expanded`
- Confirm here: `needs_interview | interviewing | ready_to_decompose -> confirmed_leaf`

## Button Mapping

- Start interview: creates an `InterviewSession`, stores one AI question, and sets `interviewing`.
- Send answer: stores one user message, extracts facts, and either asks one next question or sets `ready_to_decompose`.
- Make child modules: generates children and sets `expanded`.
- Confirm here: sets `confirmed_leaf`.

Legacy statuses are migrated when old JSON is loaded. For example, `can_decompose` becomes `ready_to_decompose`, and `work_unit` becomes `confirmed_leaf`.
