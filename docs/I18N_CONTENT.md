# Localization — Turkish and English from day one

## Rules
No hardcoded UI strings. Use dictionary-based i18n with `tr` and `en`, typed keys, fallback to English and a clear missing-key warning in development. Language switch should not remount/clear canvas or lesson progress. Persist preference locally; default browser language `tr` if Turkish, otherwise `en`. Add `<html lang>` update and translated accessible labels. Keep locale-independent geometry IDs and content IDs. Future languages can be added without rewriting the engine.

## Core copy
| Key | TR | EN |
|---|---|---|
| tagline | Keşfet. Anla. Üret. | Explore. Understand. Create. |
| learn | Öğren | Learn |
| create | Üret | Create |
| explore | Keşfet | Explore |
| about | Hakkında | About |
| getStarted | Keşfetmeye Başla | Get Started |
| drawingStudio | Çizim Atölyesi | Drawing Studio |
| decodePattern | Deseni Çöz | Decode the Pattern |
| doIt | Uygula | Do It |
| whyItWorks | Neden Böyle? | Why It Works |
| mathDetails | Matematik Detayı | Math Details |
| select | Seç | Select |
| point | Nokta | Point |
| line | Doğru Parçası | Line Segment |
| circle | Çember | Circle |
| polygon | Çokgen | Polygon |
| compass | Pergel | Compass |
| undo | Geri Al | Undo |
| redo | Yinele | Redo |
| reset | Sıfırla | Reset |
| save | Kaydet | Save |
| exportPng | PNG İndir | Export PNG |
| exportSvg | SVG İndir | Export SVG |
| next | Sonraki Adım | Next Step |
| showGeometry | Geometriyi Göster | Reveal Geometry |
| rotateAngle | Döndürme Açısı | Rotation Angle |
| sixPetalFlower | Altı Yapraklı Çiçek | Six-Petal Flower |
| eightPointStar | Sekiz Köşeli Yıldız | Eight-Point Star |
| worldPatterns | Dünyadan Geometrik Desenler | Geometric Patterns Around the World |
| hint | İpucu | Hint |
| tryAgain | Tekrar Dene | Try Again |
| completed | Tamamlandı | Completed |

All lesson narratives and cultural descriptions must have both versions, not just nav labels. Use English for global brand name PatternLab in both locales.
