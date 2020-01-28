import {
  BRAND_COLOR,
  CategoricalColorNamespace,
  CategoricalColorScale,
  CategoricalScheme,
  getCategoricalSchemeRegistry,
  getSequentialSchemeRegistry,
  SequentialScheme,
} from '../src';

describe('index', () => {
  it('exports modules', () => {
    [
      BRAND_COLOR,
      CategoricalColorNamespace,
      CategoricalColorScale,
      CategoricalScheme,
      getCategoricalSchemeRegistry,
      getSequentialSchemeRegistry,
      SequentialScheme,
    ].forEach(x => expect(x).toBeDefined());
  });
});
