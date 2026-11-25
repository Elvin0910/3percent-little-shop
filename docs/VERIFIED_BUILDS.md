# Version and QA record

| Line | Identity | Result | Use |
| --- | --- | --- | --- |
| Sites V3 baseline | `bb2a0cab725efd3d63260943cc157c84d56363c1` | Playable source, 18 state checks and real shop flow previously verified | Historical baseline |
| Neighborhood v1 | `04ae9a9f6f68a6b459797f24b9e9ec3882ddb5f24330c938321478edb1c3aa4a` | `PARTIAL_FUNCTIONAL_PASS_GAMEPLAY_REVISION_NEEDED` | Rejected as Owner review build: event too easy to miss |
| Neighborhood v2 | `93173ca1f16a4242ac9f5f023dd84d9d808c7f4d0931ceae3ac679bb4815f773` | `PASS_TARGETED_REVISION_READY_FOR_OWNER_SLICE_PLAYTEST`; 22 state checks | This repository's first playable source snapshot |
| Painted NPC and gait experiments | `a571d6ab…`, `7ab4a230…` | Overall visual QA not accepted | Keep in local Game Studio checkpoints; do not merge into stable game |

The Neighborhood v2 QA covered the persistent story prompt after sales, a postcard visible after reload, a narrow two-row action dock, and normal Day 1 close. It did not accept all animation, every event branch, long-term game depth, or public release. The full local build and independent QA checkpoints remain in the Game Studio archive. This repository contains the playable source and concise development history, not private browser recordings or company coordination records.

Current main-branch rule: code changes enter a task branch or separate working copy. Run state checks and a real browser playtest; Game_Playtest_QA reviews a frozen identity before Director merges. Do not treat a passing test suite as art or gameplay acceptance.
