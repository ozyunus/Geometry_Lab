# Geometry engine requirements

## Canonical scene model
Use normalized geometry objects independent of UI language: Point {id,x,y}; Segment {id,a,b}; Circle {id,cx,cy,r}; RegularPolygon {id,cx,cy,n,r,rotationDeg}; Group {id,childIds,rotationDeg}; plus style, visibility, locked, constructionLine metadata. Coordinates in SVG viewBox units. Geometry state must not contain localized text.

## Interaction
Pointer events + touch; clear tap targets >=44 CSS px. Tool select, point, segment, circle, regular polygon; circle by center then radius/drag; rotation handle or slider; grid snap optional; show center and radius; undo/redo using scene history. Zoom controls; avoid scrolling the page when drawing on touch (`touch-action: none` on canvas).

## Mathematical validation
Use floating point tolerances scaled to scene coordinates. Compare equal radii within tolerance (e.g. 2%); six rosette circle centers lie within tolerance of reference center-to-center distance r and angles 0,60,120,180,240,300° modulo rotation; circles share radius r. Provide feedback on which condition fails rather than binary wrong/right. Support student-chosen starting rotation. Never validate by pixel color or screenshots.

## Rotation demo
Two identical squares share a center and dimensions. Second rotated by angle slider. At 0 and 90 degrees shapes coincide; at 45 degrees eight corner directions are evenly spaced. Keep accurate polygon outlines and optional highlight of star silhouette.

## Save/export
Persist JSON scene, language preference, lesson progress, optional latest draft to localStorage (versioned schema). Export actual SVG from scene and raster PNG via SVG-to-canvas conversion. Verify SVG opens independently. Provide download names like `patternlab-design-YYYY-MM-DD.svg`. Handle storage failure gracefully.

## Implementation notes
Use deterministic pure geometry helpers (distance, angle normalization, rotate point, compare approximate). Build unit tests for center distances, sixfold symmetry and square rotation. Maintain a single source of truth for rendered geometry and validation.
