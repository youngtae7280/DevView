# Interview UX

RPD interviews are one-question-at-a-time chat sessions.

## Principles

- Show only one active AI question for the selected node.
- The user answers in free text.
- Do not present radio buttons, checkboxes, selects, or multi-question forms.
- The next question is dynamic and depends on the previous answer.
- If the answer is sufficient, the node moves to `ready_to_decompose`.
- Child modules are generated only when the user clicks Make child modules.
- The user can click Confirm here to mark a node as `confirmed_leaf`.

## What RPD Does Not Decide

RPD does not ask the user to set:

- Priority
- Risk level
- Cycle size
- Final development work unit

Those decisions belong to a later planning stage.

## Chat Flow

1. Select a node.
2. Click Start interview.
3. AI asks one free-text question.
4. User sends a sentence-form answer.
5. Mock Provider extracts facts and decides the next turn.
6. The session either asks one more question, becomes ready to decompose, or suggests confirming the node.

## Confirmed Leaf

`confirmed_leaf` means the branch is a final requirement leaf for RPD. It does not mean the branch is ready as an implementation ticket.
