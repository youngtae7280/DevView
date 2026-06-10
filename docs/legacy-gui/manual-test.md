# Manual Test

Use this scenario to verify the full PBE MVP flow.

1. Start the app.
2. Create a new project.
3. Enter a root request.
4. Start the RPD interview.
5. Answer the single active question.
6. Decompose the root when it becomes ready.
7. Select at least two child nodes.
8. Confirm those child nodes as `confirmed_leaf`.
9. Click `Complete RPD and move to WPD`.
10. Click `Generate leaf work`.
11. Click `Synthesize parents`.
12. Click `Generate roadmap`.
13. Click `Complete WPD and move to VD`.
14. Click `Generate leaf verification`.
15. Click `Synthesize verification`.
16. Click `Generate acceptance plan`.
17. Click `Complete VD and generate ACEP`.
18. Open the `ACEP files` preview.
19. Confirm `execution-manifest.json` appears in the virtual file list.
20. Open the `ACEP content` preview.
21. Select at least one generated file and confirm its content is visible.
22. Open the `ACEP bundle` preview and confirm file paths and contents appear together.
23. Open the `Codex prompt` preview.
24. Copy the handoff prompt.
25. Export the ACEP Markdown bundle.
26. Export the manifest JSON.
27. Export the virtual file list.
28. Export the bundle preview.

Expected result: Mock Provider can complete the entire flow without an OpenAI API key.
