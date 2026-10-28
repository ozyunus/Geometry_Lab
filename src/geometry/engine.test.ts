import { distance, approximateEqual, rotatePoint, normalizeAngleDeg, getPolygonVertices, validateRosette } from './engine';
import { GeoScene } from '../types/geometry';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

console.log('Running Geometry Engine Unit Tests...');

// 1. Distance
const d = distance({ x: 0, y: 0 }, { x: 3, y: 4 });
assert(approximateEqual(d, 5), `distance(0,0 -> 3,4) should be 5, got ${d}`);
console.log('✓ distance() test passed');

// 2. Normalization
assert(normalizeAngleDeg(400) === 40, 'normalizeAngleDeg(400) should be 40');
assert(normalizeAngleDeg(-90) === 270, 'normalizeAngleDeg(-90) should be 270');
console.log('✓ normalizeAngleDeg() test passed');

// 3. Approximate Equal
assert(approximateEqual(100, 103, 0.05), '100 and 103 within 5% tolerance');
assert(!approximateEqual(100, 115, 0.05), '100 and 115 outside 5% tolerance');
console.log('✓ approximateEqual() test passed');

// 4. Rotate Point (rotate (10, 0) around (0, 0) by 90 deg -> (0, 10))
const rotated = rotatePoint({ x: 10, y: 0 }, { x: 0, y: 0 }, 90);
assert(approximateEqual(rotated.x, 0, 0.01), `rotated x should be ~0, got ${rotated.x}`);
assert(approximateEqual(rotated.y, 10, 0.01), `rotated y should be ~10, got ${rotated.y}`);
console.log('✓ rotatePoint() test passed');

// 5. Regular Polygon Vertices (Square sides = 4)
const squareVerts = getPolygonVertices({ x: 0, y: 0 }, 4, 100, 0);
assert(squareVerts.length === 4, 'square should have 4 vertices');
console.log('✓ getPolygonVertices() test passed');

// 6. Rosette Validation (Perfect 6-petal rosette)
const cx = 250;
const cy = 250;
const R = 100;
const testScene: GeoScene = {
  points: [{ id: 'center', x: cx, y: cy }],
  segments: [],
  circles: [{ id: 'c-center', centerId: 'center', radius: R }],
  polygons: [],
};

for (let i = 0; i < 6; i++) {
  const angle = (i * 60) * (Math.PI / 180);
  const px = cx + R * Math.cos(angle);
  const py = cy + R * Math.sin(angle);
  const pid = `p-${i}`;
  testScene.points.push({ id: pid, x: px, y: py });
  testScene.circles.push({ id: `c-${i}`, centerId: pid, radius: R });
}

const validation = validateRosette(testScene, 'en');
assert(validation.isValid === true, `Expected valid rosette, score was ${validation.score}`);
assert(validation.score === 100, `Expected score 100, got ${validation.score}`);
console.log('✓ validateRosette() mathematical validation passed with score 100');

console.log('All Geometry Engine tests succeeded!');
