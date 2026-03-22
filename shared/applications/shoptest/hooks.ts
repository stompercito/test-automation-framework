import { Before } from '@cucumber/cucumber';
import { CustomWorld } from '../../fixtures/world';
import { applyShopTestVersion, resolveShopTestVersion } from './version';

Before({ tags: '@v1 or @v2 or @v3' }, async function (this: CustomWorld, { pickle }) {
  const scenarioTags = pickle.tags.map((tag) => tag.name);
  const selectedVersion = resolveShopTestVersion(scenarioTags, 3);

  await applyShopTestVersion(this.context, selectedVersion);
  this.data['shoptestVersion'] = selectedVersion;
});
