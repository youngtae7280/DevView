# Recursive Program Designer

RPD remains the requirement-discovery stage.

## Responsibilities

- Create a root requirement from the user's free-text request.
- Ask one open-ended interview question at a time.
- Store free-text answers and extracted facts.
- Decompose only the selected node when the user asks.
- Mark a node as `confirmed_leaf` when the branch is sufficiently decomposed.

## Completion Gate

RPD can move to WPD when:

- A root node exists.
- The tree is structurally valid.
- At least one `confirmed_leaf` exists.
- No interview session is blocked.

RPD does not decide implementation priority, risk, cycle size, or final task units. Those decisions belong to WPD and VD.
