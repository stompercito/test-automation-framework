import { TestInfo } from '@playwright/test';
import * as allure from 'allure-js-commons';

export type FailureCategory = 'product-bug' | 'system-failure' | 'test-issue' | 'data-issue';
export type VersionTag = 'v1' | 'v2' | 'v3';
export type PriorityTag = 'p0' | 'p1' | 'p2' | 'p3';
export type SeverityTag = 'blocker' | 'critical' | 'normal' | 'minor' | 'trivial';

export interface ReportLabels {
  layer: 'functional' | 'non-functional';
  area: 'ui' | 'api' | 'accessibility' | 'performance';
  story: string;
  versions: VersionTag[];
  priority: PriorityTag;
  severity: SeverityTag;
  failureCategory?: FailureCategory;
  tags?: string[];
}

export async function labelReport(labels: ReportLabels): Promise<void> {
  await allure.epic(labels.layer);
  await allure.feature(labels.area);
  await allure.story(labels.story);
  await allure.severity(labels.severity);
  await allure.tags(
    ...labels.versions,
    labels.priority,
    ...(labels.failureCategory ? [labels.failureCategory] : []),
    ...(labels.tags ?? []),
  );
}

export async function attachJsonEvidence(
  name: string,
  data: unknown,
  testInfo?: TestInfo,
): Promise<void> {
  const payload = JSON.stringify(data, null, 2);
  if (testInfo) {
    await testInfo.attach(name, {
      body: payload,
      contentType: 'application/json',
    });
  }
  await allure.attachment(name, payload, 'application/json');
}

export async function attachTextEvidence(
  name: string,
  text: string,
  testInfo?: TestInfo,
): Promise<void> {
  if (testInfo) {
    await testInfo.attach(name, {
      body: text,
      contentType: 'text/plain',
    });
  }
  await allure.attachment(name, text, 'text/plain');
}
