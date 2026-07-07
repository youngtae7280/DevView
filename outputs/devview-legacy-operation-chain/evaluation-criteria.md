# DevView Evaluation Criteria

External and native dogfood are evaluated by evidence, not by the agent saying
the change "looks right".

Current criteria:

1. Scope boundary: dirty files must stay inside the instruction pack.
2. Intent graph: every tested change must have graph-source nodes and edge
   intent.
3. Instruction pack: the selected record must produce an executable pack.
4. Graph delta: local changes must be summarized as graph deltas.
5. Behavior proof: at least one dogfood must change behavior and pass a local
   test.
6. External intent boundary: retrofit/open-source cases must not claim upstream
   maintainer intent.

The current evaluation is non-enforcing. It is a readiness signal, not a
required check.
