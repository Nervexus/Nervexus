# Anatomy muscle labels

`anatomy-model.glb` carries a `_MUSCLE` vertex attribute: one muscle-zone id per vertex,
so the red training glow follows the real outline of a muscle instead of a height band.

The ids come from **BodyParts3D** (Database Center for Life Science, University of Tokyo,
CC BY-SA 2.1 JP) — 146 individually named muscle meshes, registered onto this body and
sampled per vertex. The muscle geometry itself is never shipped; only the labels are.

## Regenerating

Run in this exact order, and **always from a pristine `anatomy-model.glb`**:

```sh
git checkout -- anatomy-model.glb     # step 1 MUST read the un-embedded model
node tools/anatomy/export.mjs          # dumps skin + muscle vertices in traversal order
python3 tools/anatomy/label.py         # nearest-muscle per skin vertex -> zones.u8
node tools/anatomy/embed.mjs           # writes _MUSCLE back into anatomy-model.glb
```

### Why the order matters

`embed.mjs` re-encodes with meshopt, which **reorders vertices**. That is safe on its own —
the label travels with its vertex — but it means `export.mjs` must never be run against an
already-embedded model. Doing so produces labels in the new order which are then applied to
the old order, and the glow comes out as confetti. It fails silently; there is no error.

### The zone table

`ZONE_NAMES` in `anatomy-3d.js`, `ZONES` in `export.mjs` and `ZONES` in `label.py` must stay
byte-for-byte identical, including the unused `delts_rear` slot. These are raw indices baked
into the model: a one-slot difference silently lights the wrong muscle (calves came out as
hamstrings the first time this was built).

## Deliberate departures from the anatomy

Two places where the correct anatomical answer is the wrong product answer:

- The external oblique's aponeurosis sheets across the midline over the rectus, so "what is
  under this skin" is genuinely *oblique* across the whole six-pack. The midline strip is
  reclaimed for `abs`.
- Adductor magnus has a large ischiocondylar belly on the posteromedial thigh, so the back of
  the leg resolves to `adductors`. The posterior thigh is reclaimed for `hamstrings`.

Hands and feet are left unlabelled — tendon and small intrinsic muscle that nobody trains as
a group, and lighting them looked like a bug.

## Known residuals

Registering one body's anatomy onto a different body has a floor. Glutes run slightly far
down the thigh; the chest sits a little low over the upper abdomen; erector spinae edges are
ragged. Further tuning does not remove these — a model with both a good body and separated
muscle groups would.
