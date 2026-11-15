# SARVA ENGINE STATUS

## Round 1, this file's first entry

Built. The SARVA engine did not exist in any attached repository or synced skill before this round, so this round
created it from the owner's instruction.

- ENGINE_CONTRACT.md, the binding requirements: five methodologies only (KP Pro, KCIL, SUJ engine, CHAWDHRI, BNN),
  every question analysed under each, one finalized option per methodology, final table as the last output.
- METHOD_ROUTING.md, how to run each methodology and where its rules live.
- ANSWER_TEMPLATE.md, the exact line layout of a SARVA reply.
- tools/sarva_guard.js and tests/guard_test.js, the enforcement. Run the test with node sarva_engine/tests/guard_test.js.
- CLAUDE.md at the repository root now makes every new session in this repository recognise the SARVA engine.

## Pending

1. BNN rule files 02 to 10 are not in any attached repository or synced skill. Only the chart export runner is.
   Until the owner adds them under sarva_engine/knowledge/bnn/, the BNN cell reads NOT RUN BNN RULES MISSING and the
   guard exits with code 3.
2. No chart has been run through SARVA yet. The first live run is the first test of the routing commands, in
   particular the first run of CHAWDHRI jyotish.sh, which clones VedNetra, and pip install of kpredict.
3. kpredict has no command that prints a bare KP Pro or KCIL option for a quiz style question. The ask command is
   prior dominant. The routing therefore reads the per method opinion of the read command with the methodology's
   own rules. A dedicated per method option mapper is a candidate for the next round.
4. The sibling repositories must be attached to the session. If one is missing the engine says so and asks.
