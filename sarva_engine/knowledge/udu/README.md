# Udu in the SARVA engine

Installed. UDU-METHODOLOGY.pdf, its text, its heading index and UDU_PROCEDURE.md, the English map.

Not installed, and required before the Udu column can be run. The nine corpus files, 11,683 rules in total.
UDU-vivah-sambandh.md 1,250, UDU-karya-dhan.md 2,758, UDU-arogya-ayu.md 1,597, UDU-vidya-swabhav.md 2,501,
UDU-santan-parivar.md 837, UDU-dharma-upay.md 1,074, UDU-samay-muhurat.md 888, UDU-yatra-shatru.md 360, UDU-mool-tattva.md 418.
Also wanted, the four UDU-REF files and UDU-000-MANIFEST.md.

Put them in this folder with those exact names. The guard treats the corpus as present only when all nine files exist, and until
then the Udu cell reads NOT RUN UDU RULES MISSING, as the Udu method itself forbids answering without its rules.
A lookup tool like tools/bnn_rules.js should be built once the real file layout is in hand, it was not built blind.

Update of 17 November 2026. While these files are missing the Udu column fires through the provisional promise layer of sarva_engine/tools/promise_layer.js, ENGINE_CONTRACT.md section 13. The layer is authored by the SARVA engine author, is not this corpus, and its cells say PROVISIONAL. Placing the nine files here switches the column back to the corpus rules.
