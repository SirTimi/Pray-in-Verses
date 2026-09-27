const { withGradleProperties } = require('expo/config-plugins');

const RELEASE_PROPERTIES = {
  'android.enableMinifyInReleaseBuilds': 'true',
  'android.enableShrinkResourcesInReleaseBuilds': 'true',
};

function setGradleProperty(items, key, value) {
  const existing = items.find(
    (item) => item.type === 'property' && item.key === key,
  );

  if (existing) {
    existing.value = value;
    return;
  }

  items.push({
    type: 'property',
    key,
    value,
  });
}

module.exports = function withAndroidReleaseOptimization(config) {
  return withGradleProperties(config, (configWithProperties) => {
    for (const [key, value] of Object.entries(RELEASE_PROPERTIES)) {
      setGradleProperty(configWithProperties.modResults, key, value);
    }

    return configWithProperties;
  });
};
