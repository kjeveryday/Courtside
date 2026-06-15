# Ballhalla — Game Design Document (fixture excerpt)

Sample consuming-project GDD so the dashboard's source links resolve in the demo.
Sections match the `sourceRef` anchors used by the fixture's tasks and gate.

## Units

Each unit carries STR, SPD, and RNG stats. Guards are slow (SPD 3) but wide;
Wings are fast (SPD 5) but fragile. Stats are integers, tuned in `units.tres`.

## Movement ranges

A unit may move up to SPD tiles per turn, orthogonally, through unblocked tiles.
Blocked tiles (walls, occupied tiles) are excluded from the reachable set — no
diagonal corner-cutting. The reachable set is computed by flood fill from the
unit's tile with uniform cost. Selecting a unit and pressing M shows the overlay;
the debug panel prints `MOVE range=N src=SPD`.

## Movement

Clicking a highlighted tile moves the unit along the shortest path, animated
tile-to-tile at 8 tiles/second. Movement consumes the unit's move action; a unit
may still take one main action (pass / shoot) after moving.

## Actions

After moving (or instead of it), a unit takes one main action from a radial menu:
**Pass** (to a teammate in RNG), **Shoot** (toward the hoop, see shot resolution),
or **End** (bank the unused action for +5% next-turn shot bonus).

## Shot resolution

Shot chance = BASE(distance band) + STR modifier − defender pressure, clamped to
[5%, 95%]. Distance bands: paint 65%, mid 45%, deep 25%. Pressure: −10% per
adjacent defender. Crits (double points) on rolls ≤ 5% of the final chance.
Airborne crit handling is open question Q-7 — ground formula only, per this doc.
