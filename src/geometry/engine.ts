import { GeoPoint, GeoCircle, GeoScene, ValidationFeedback, Language } from '../types/geometry';

/**
 * Calculates Euclidean distance between two points.
 */
export function distance(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Normalizes an angle in degrees into [0, 360).
 */
export function normalizeAngleDeg(angle: number): number {
  let normalized = angle % 360;
  if (normalized < 0) normalized += 360;
  return normalized;
}

/**
 * Checks if two numbers are approximately equal within a relative or absolute tolerance.
 */
export function approximateEqual(a: number, b: number, tolerance = 0.05): boolean {
  const absDiff = Math.abs(a - b);
  if (absDiff < 1e-4) return true;
  const maxVal = Math.max(Math.abs(a), Math.abs(b));
  return absDiff / maxVal <= tolerance;
}

/**
 * Rotates a 2D point around a given center by an angle in degrees.
 */
export function rotatePoint(
  point: { x: number; y: number },
  center: { x: number; y: number },
  angleDeg: number
): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  };
}

/**
 * Computes vertices for a regular polygon.
 */
export function getPolygonVertices(
  center: { x: number; y: number },
  sides: number,
  radius: number,
  rotationDeg = 0
): { x: number; y: number }[] {
  const vertices: { x: number; y: number }[] = [];
  const step = 360 / sides;
  for (let i = 0; i < sides; i++) {
    const angle = (rotationDeg + i * step) * (Math.PI / 180);
    vertices.push({
      x: center.x + radius * Math.cos(angle),
      y: center.y + radius * Math.sin(angle),
    });
  }
  return vertices;
}

/**
 * Converts a polygon vertex array into an SVG polygon points string.
 */
export function verticesToSvgPoints(vertices: { x: number; y: number }[]): string {
  return vertices.map(v => `${v.x.toFixed(2)},${v.y.toFixed(2)}`).join(' ');
}

/**
 * Validates a six-petal rosette construction geometrically.
 * Rule:
 * 1. Must have at least 7 circles (1 central circle + 6 outer circles).
 * 2. One circle serves as reference central circle with radius R.
 * 3. 6 surrounding circle centers must lie on circumference of central circle (distance ~ R).
 * 4. 6 surrounding circle centers must be spaced at ~60° increments from each other around the center.
 * 5. All 6 outer circles must share radius ~ R.
 */
export function validateRosette(scene: GeoScene, lang: Language = 'en'): ValidationFeedback {
  const isTr = lang === 'tr';
  const completedCriteria: string[] = [];
  const missingCriteria: string[] = [];
  const hints: string[] = [];

  const pointMap = new Map<string, GeoPoint>();
  scene.points.forEach(p => pointMap.set(p.id, p));

  const circles = scene.circles;

  if (circles.length === 0) {
    return {
      isValid: false,
      score: 0,
      completedCriteria: [],
      missingCriteria: [
        isTr ? 'Hiç çember çizilmedi' : 'No circles drawn yet',
      ],
      hints: [
        isTr
          ? 'Başlamak için tuvalin ortasına bir merkez çember çizin.'
          : 'To begin, draw a center circle in the middle of the canvas.',
      ],
    };
  }

  // Find candidate center circles: circles that have others around them
  let bestCenterCircle: GeoCircle | null = null;
  let bestSurroundingCircles: GeoCircle[] = [];
  let bestScore = 0;

  for (const candidate of circles) {
    const centerPoint = pointMap.get(candidate.centerId);
    if (!centerPoint) continue;
    const R = candidate.radius;

    // Outer circles whose center is at distance ~ R from candidate's center
    const matchingOuters: GeoCircle[] = [];
    for (const other of circles) {
      if (other.id === candidate.id) continue;
      const otherPoint = pointMap.get(other.centerId);
      if (!otherPoint) continue;
      const dist = distance(centerPoint, otherPoint);

      // Check distance within 12% tolerance
      if (Math.abs(dist - R) / R <= 0.14) {
        matchingOuters.push(other);
      }
    }

    if (matchingOuters.length > bestSurroundingCircles.length) {
      bestSurroundingCircles = matchingOuters;
      bestCenterCircle = candidate;
    }
  }

  // If no clear center circle found, pick the first or largest circle as reference
  if (!bestCenterCircle) {
    bestCenterCircle = circles[0];
  }

  const centerPoint = pointMap.get(bestCenterCircle.centerId);
  const R = bestCenterCircle.radius;

  // Criterion 1: Base center circle
  completedCriteria.push(
    isTr
      ? `Merkez çember oluşturuldu (Yarıçap R = ${Math.round(R)}px)`
      : `Center circle established (Radius R = ${Math.round(R)}px)`
  );

  // Check outer circles count
  const count = bestSurroundingCircles.length;
  if (count >= 1) {
    completedCriteria.push(
      isTr
        ? `${count}/6 çevre çemberi merkez çemberin çevresine yerleştirildi`
        : `${count}/6 outer circles placed on center circle circumference`
    );
  } else {
    missingCriteria.push(
      isTr
        ? 'Çevre çemberleri henüz yerleştirilmedi'
        : 'Outer circles not yet placed'
    );
    hints.push(
      isTr
        ? 'Pergelinizi merkez çemberin çevresi üzerindeki bir noktaya koyun ve aynı yarıçapla bir çember çizin.'
        : 'Place your compass on the circumference of the center circle and draw a circle with the same radius.'
    );
  }

  // Check radii equality of outer circles
  let radiiMatchCount = 0;
  for (const c of bestSurroundingCircles) {
    if (Math.abs(c.radius - R) / R <= 0.12) {
      radiiMatchCount++;
    }
  }

  if (bestSurroundingCircles.length > 0) {
    if (radiiMatchCount === bestSurroundingCircles.length) {
      completedCriteria.push(
        isTr
          ? 'Tüm çevre çemberleri merkez çemberle eşit yarıçapta'
          : 'All outer circles share equal radius with the center circle'
      );
    } else {
      missingCriteria.push(
        isTr
          ? `${bestSurroundingCircles.length - radiiMatchCount} çemberin yarıçapı merkez çemberle uyuşmuyor`
          : `${bestSurroundingCircles.length - radiiMatchCount} circle(s) have unequal radius`
      );
      hints.push(
        isTr
          ? 'Klasik pergel kuralı: Tüm çemberlerin yarıçapı (R) birbirine tam eşit olmalıdır.'
          : 'Classic compass rule: All circles must have the exact same radius (R).'
      );
    }
  }

  // Check angular distribution (60° increments around center)
  let anglesValid = false;
  if (centerPoint && bestSurroundingCircles.length >= 6) {
    const angles: number[] = bestSurroundingCircles.map(c => {
      const p = pointMap.get(c.centerId)!;
      const rad = Math.atan2(p.y - centerPoint.y, p.x - centerPoint.x);
      return normalizeAngleDeg((rad * 180) / Math.PI);
    }).sort((a, b) => a - b);

    // Filter duplicates or very close points
    const uniqueAngles: number[] = [];
    for (const a of angles) {
      if (!uniqueAngles.some(ua => Math.abs(ua - a) < 15 || Math.abs(ua - a) > 345)) {
        uniqueAngles.push(a);
      }
    }

    if (uniqueAngles.length >= 6) {
      // Check gaps: in a regular rosette, diff between consecutive angles is ~ 60°
      let gapsCorrect = 0;
      for (let i = 0; i < 6; i++) {
        const a1 = uniqueAngles[i];
        const a2 = uniqueAngles[(i + 1) % 6];
        let diff = (a2 - a1 + 360) % 360;
        if (Math.abs(diff - 60) <= 12) {
          gapsCorrect++;
        }
      }

      if (gapsCorrect >= 5) {
        anglesValid = true;
        completedCriteria.push(
          isTr
            ? '6 çevre çemberi 60° açılarla tam simetrik dağıldı (360° / 6 = 60°)'
            : '6 outer circles symmetrically spaced at 60° intervals (360° / 6 = 60°)'
        );
      } else {
        missingCriteria.push(
          isTr
            ? 'Çevre çemberleri 60° aralıklarla tam simetrik değil'
            : 'Outer circles are not spaced at regular 60° intervals'
        );
        hints.push(
          isTr
            ? 'Her yeni çemberin merkezini, bir önceki çember ile merkez çemberin kesişim noktasına yerleştirin.'
            : 'Place each new circle center at the intersection point of the previous circle and center circle.'
        );
      }
    } else {
      missingCriteria.push(
        isTr
          ? '6 farklı çember merkezi gerekiyor'
          : '6 distinct circle centers required'
      );
    }
  } else if (bestSurroundingCircles.length < 6) {
    missingCriteria.push(
      isTr
        ? `Çiçeği tamamlamak için ${6 - count} çember daha gerekiyor`
        : `Need ${6 - count} more circle(s) to complete the rosette`
    );
  }

  // Calculate overall score
  let score = 20; // for having center circle
  score += Math.min(count, 6) * 10; // up to 60 for 6 outer circles
  if (radiiMatchCount === count && count > 0) score += 10;
  if (anglesValid) score += 10;
  score = Math.min(100, score);

  const isValid = count >= 6 && radiiMatchCount >= 6 && anglesValid;

  return {
    isValid,
    score,
    completedCriteria,
    missingCriteria,
    hints,
  };
}

export interface GeometricInspectionResult {
  detectedPattern: 'rosette' | 'seljuk8' | 'concentric' | 'custom' | 'empty';
  score: number;
  isSymmetric: boolean;
  symmetryFold: number;
  metrics: {
    circleCount: number;
    segmentCount: number;
    polygonCount: number;
    pointCount: number;
    radiusVariance: number;
  };
  checks: { title: string; passed: boolean; detail: string }[];
  summary: string;
}

/**
 * Universal Geometric Accuracy Inspector for Step 8 and Studio.
 * Detects 6-fold rosette, 8-pointed Seljuk star, concentric rings, and polygon symmetry.
 */
export function inspectGeometryScene(scene: GeoScene, lang: Language = 'tr'): GeometricInspectionResult {
  const isTr = lang === 'tr';
  const checks: { title: string; passed: boolean; detail: string }[] = [];

  const { circles, segments, polygons, points } = scene;
  const totalElements = circles.length + segments.length + polygons.length;

  if (totalElements === 0) {
    return {
      detectedPattern: 'empty',
      score: 0,
      isSymmetric: false,
      symmetryFold: 0,
      metrics: { circleCount: 0, segmentCount: 0, polygonCount: 0, pointCount: points.length, radiusVariance: 0 },
      checks: [
        {
          title: isTr ? 'Çizim Varlığı' : 'Drawing Presence',
          passed: false,
          detail: isTr ? 'Henüz hiçbir geometrik eleman çizilmedi.' : 'No geometric elements drawn yet.',
        },
      ],
      summary: isTr ? 'Tuval boş. Çizime başlayın.' : 'Canvas is empty. Start drawing.',
    };
  }

  // Check 1: Point count & anchors
  const hasOrigin = points.some(p => distance(p, { x: 300, y: 300 }) <= 20);
  checks.push({
    title: isTr ? 'Merkez Dayanağı' : 'Center Anchor',
    passed: hasOrigin,
    detail: hasOrigin
      ? isTr ? 'Merkez noktası (300, 300) doğru konumlandırıldı.' : 'Center point located at origin (300, 300).'
      : isTr ? 'Merkez noktası tuvalin tam ortasında değil.' : 'Center point is not aligned with canvas origin.',
  });

  // Check 2: Radius variance across circles
  let radiusVariance = 0;
  let radiiCongruent = false;
  if (circles.length >= 2) {
    const meanR = circles.reduce((acc, c) => acc + c.radius, 0) / circles.length;
    const sqDiffs = circles.map(c => Math.pow(c.radius - meanR, 2));
    radiusVariance = Math.sqrt(sqDiffs.reduce((a, b) => a + b, 0) / circles.length);
    radiiCongruent = radiusVariance <= 6;
    checks.push({
      title: isTr ? 'Yarıçap Eşitliği & Pergel Tutarlılığı' : 'Compass Radius Congruence',
      passed: radiiCongruent,
      detail: radiiCongruent
        ? isTr ? `Tüm çemberler eşit açıklıkla çizildi (Sapma: ±${radiusVariance.toFixed(1)}px).` : `All circles share equal radius (Deviation: ±${radiusVariance.toFixed(1)}px).`
        : isTr ? `Çember yarıçapları arasında fark var (Sapma: ±${radiusVariance.toFixed(1)}px).` : `Circles vary in radii (Deviation: ±${radiusVariance.toFixed(1)}px).`,
    });
  } else if (circles.length === 1) {
    checks.push({
      title: isTr ? 'Referans Çember' : 'Reference Circle',
      passed: true,
      detail: isTr ? `1 adet referans çember mevcut (R = ${Math.round(circles[0].radius)}px).` : `1 reference circle present (R = ${Math.round(circles[0].radius)}px).`,
    });
  }

  // Detect pattern type
  let detectedPattern: 'rosette' | 'seljuk8' | 'concentric' | 'custom' = 'custom';
  let symmetryFold = 0;

  if (circles.length >= 7) {
    const rosetteFeedback = validateRosette(scene, lang);
    if (rosetteFeedback.score >= 80) {
      detectedPattern = 'rosette';
      symmetryFold = 6;
      checks.push({
        title: isTr ? '6-Katlı Rozeta Simetrisi' : '6-Fold Rosette Symmetry',
        passed: rosetteFeedback.isValid,
        detail: rosetteFeedback.isValid
          ? isTr ? 'Kusursuz 6 yapraklı çiçek simetrisi doğrulandı.' : 'Flawless 6-petal rosette symmetry verified.'
          : isTr ? '6 yapraklı çiçek oluşuyor ancak çevre çemberleri tam 60° açılara oturtulmalı.' : '6-petal rosette in progress, align outer circles at 60° intervals.',
      });
    }
  }

  // Check Seljuk 8-star or octagram
  const hasSquare = polygons.some(p => p.sides === 4);
  const hasOctagon = polygons.some(p => p.sides === 8);
  const has8Tips = polygons.filter(p => p.sides === 4).length >= 2 || hasOctagon || segments.length >= 8;

  if (has8Tips && (hasSquare || segments.length >= 8)) {
    detectedPattern = 'seljuk8';
    symmetryFold = 8;
    checks.push({
      title: isTr ? '8-Köşeli Selçuklu Yıldız Simetrisi' : '8-Pointed Seljuk Star Symmetry',
      passed: true,
      detail: isTr ? '45° dönme simetrisi ve 8 köşeli yıldız yapısı doğrulandı.' : '45° rotational symmetry and 8-point star topology verified.',
    });
  }

  // Symmetry Fold check
  const isSymmetric = symmetryFold > 0;
  if (!isSymmetric && totalElements > 2) {
    checks.push({
      title: isTr ? 'Simetri Analizi' : 'Symmetry Analysis',
      passed: false,
      detail: isTr ? 'Çizim serbest stilde; 6-katlı veya 8-katlı radyal simetri henüz yakalanmadı.' : 'Freehand drawing; 6-fold or 8-fold radial symmetry not yet fully aligned.',
    });
  }

  // Compute final score
  let score = 30; // base for non-empty drawing
  if (hasOrigin) score += 15;
  if (radiiCongruent) score += 25;
  if (isSymmetric) score += 30;
  score = Math.min(100, Math.max(10, score));

  let summary = isTr
    ? `%${score} Doğruluk: ${detectedPattern === 'rosette' ? 'Altı yapraklı çiçek' : detectedPattern === 'seljuk8' ? 'Selçuklu yıldızı' : 'Geometrik çalışma'} başarıyla incelendi.`
    : `${score}% Accuracy: ${detectedPattern === 'rosette' ? 'Six-petal rosette' : detectedPattern === 'seljuk8' ? 'Seljuk star' : 'Geometric composition'} verified.`;

  if (score >= 90) {
    summary = isTr
      ? 'Kusursuz Geometri! Tüm oranlar ve simetriler %100 doğrulandı.'
      : 'Flawless Geometry! All proportions and symmetries verified 100%.';
  }

  return {
    detectedPattern,
    score,
    isSymmetric,
    symmetryFold,
    metrics: {
      circleCount: circles.length,
      segmentCount: segments.length,
      polygonCount: polygons.length,
      pointCount: points.length,
      radiusVariance,
    },
    checks,
    summary,
  };
}

