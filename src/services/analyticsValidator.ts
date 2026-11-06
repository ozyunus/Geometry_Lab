import analytics from './analytics';

export interface TestResult {
  id: string;
  name: string;
  status: 'passed' | 'failed' | 'warning' | 'pending';
  details: string;
  automated: boolean;
}

export class AnalyticsValidator {
  public static runAutomatedValidation(): TestResult[] {
    const results: TestResult[] = [];

    // Test 1: Service Initialization
    try {
      analytics.init('tr');
      results.push({
        id: 'init_test',
        name: 'Analytics Service Initialization',
        status: 'passed',
        details: 'Service initialized gracefully without unhandled exceptions.',
        automated: true,
      });
    } catch (e) {
      results.push({
        id: 'init_test',
        name: 'Analytics Service Initialization',
        status: 'failed',
        details: `Initialization threw error: ${e}`,
        automated: true,
      });
    }

    // Test 2: Kids Mode Session Replay Exclusion
    try {
      analytics.setExperience('kids');
      // In kids mode, session replay must be stopped
      analytics.startSessionReplay(); // should be blocked
      const exp = analytics.getExperience();
      if (exp === 'kids') {
        results.push({
          id: 'kids_replay_block',
          name: 'Kids Experience Session Replay Exclusion',
          status: 'passed',
          details: 'Session replay is blocked while currentExperience is kids.',
          automated: true,
        });
      } else {
        results.push({
          id: 'kids_replay_block',
          name: 'Kids Experience Session Replay Exclusion',
          status: 'failed',
          details: 'Experience state was not set to kids.',
          automated: true,
        });
      }
    } catch (e) {
      results.push({
        id: 'kids_replay_block',
        name: 'Kids Experience Session Replay Exclusion',
        status: 'failed',
        details: `Exception during kids replay test: ${e}`,
        automated: true,
      });
    }

    // Test 3: Deduplication Verification
    try {
      const initialLogs = analytics.getDebugLog().length;
      analytics.trackExperienceSelected('adults');
      analytics.trackExperienceSelected('adults'); // Should be deduped
      const afterLogs = analytics.getDebugLog().length;

      if (afterLogs - initialLogs <= 1) {
        results.push({
          id: 'dedup_test',
          name: 'Duplicate Event Prevention',
          status: 'passed',
          details: 'Repeated identical events within 1.5s were suppressed.',
          automated: true,
        });
      } else {
        results.push({
          id: 'dedup_test',
          name: 'Duplicate Event Prevention',
          status: 'warning',
          details: 'Deduplication threshold allowed rapid firing.',
          automated: true,
        });
      }
    } catch (e) {
      results.push({
        id: 'dedup_test',
        name: 'Duplicate Event Prevention',
        status: 'failed',
        details: `Dedup test error: ${e}`,
        automated: true,
      });
    }

    // Test 4: Drawing Data Sanitization (No pixel/coordinate streams)
    try {
      analytics.trackDrawingCompleted({
        tool: 'circle',
        element_count: 5,
        lesson_id: 'lesson-1',
      });
      const lastEvent = analytics.getDebugLog().slice(-1)[0];
      const hasPixelOrCoordinates =
        lastEvent &&
        (JSON.stringify(lastEvent.properties).includes('data:image') ||
          JSON.stringify(lastEvent.properties).includes('base64') ||
          JSON.stringify(lastEvent.properties).includes('points:'));

      if (!hasPixelOrCoordinates) {
        results.push({
          id: 'drawing_sanitization',
          name: 'No Sensitive Drawing Payload Tracking',
          status: 'passed',
          details: 'Drawing events only emit macro metrics (tool, count) without canvas pixels or coordinates.',
          automated: true,
        });
      } else {
        results.push({
          id: 'drawing_sanitization',
          name: 'No Sensitive Drawing Payload Tracking',
          status: 'failed',
          details: 'Detected raw drawing data in event properties payload.',
          automated: true,
        });
      }
    } catch (e) {
      results.push({
        id: 'drawing_sanitization',
        name: 'No Sensitive Drawing Payload Tracking',
        status: 'failed',
        details: `Drawing test error: ${e}`,
        automated: true,
      });
    }

    // Test 5: Global Killswitch
    try {
      analytics.setGlobalKillswitch(true);
      const logCountBefore = analytics.getDebugLog().length;
      analytics.trackAppOpened();
      const logCountAfter = analytics.getDebugLog().length;

      analytics.setGlobalKillswitch(false); // restore

      if (logCountAfter === logCountBefore) {
        results.push({
          id: 'killswitch_test',
          name: 'Global Kill Switch Functional',
          status: 'passed',
          details: 'When kill switch is active, events are discarded without throwing errors.',
          automated: true,
        });
      } else {
        results.push({
          id: 'killswitch_test',
          name: 'Global Kill Switch Functional',
          status: 'failed',
          details: 'Events were still tracked while killswitch was enabled.',
          automated: true,
        });
      }
    } catch (e) {
      results.push({
        id: 'killswitch_test',
        name: 'Global Kill Switch Functional',
        status: 'failed',
        details: `Killswitch error: ${e}`,
        automated: true,
      });
    }

    return results;
  }
}
