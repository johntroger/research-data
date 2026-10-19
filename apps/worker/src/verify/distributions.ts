/**
 * p-values from test statistics (step 1.5, statcheck-style recomputation, Mục 6.3).
 * Pure numerics: regularised incomplete beta (Lentz continued fraction) for t and F, erfc for z.
 */

function lgamma(z: number): number {
  const c = [76.18009172947146, -86.5053203294168, 24.01409824083091, -1.23173957245015, 0.001208650973866179, -0.000005395239384953];
  let y = z;
  let tmp = z + 5.5;
  tmp -= (z + 0.5) * Math.log(tmp);
  let ser = 1.000000000190015;
  for (const coefficient of c) ser += coefficient / ++y;
  return -tmp + Math.log((2.506628274631 * ser) / z);
}

function betacf(a: number, b: number, x: number): number {
  const FPMIN = 1e-300;
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= 500; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const delta = d * c;
    h *= delta;
    if (Math.abs(delta - 1) < 3e-16) break;
  }
  return h;
}

/** Regularised incomplete beta function I_x(a, b). */
export function incompleteBeta(x: number, a: number, b: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
  return x < (a + 1) / (a + b + 2) ? (bt * betacf(a, b, x)) / a : 1 - (bt * betacf(b, a, 1 - x)) / b;
}

/** Two-tailed p of a t statistic with `df` degrees of freedom. */
export function tTwoTailedP(t: number, df: number): number {
  return incompleteBeta(df / (df + t * t), df / 2, 0.5);
}

/** Upper-tail p of an F statistic with (df1, df2) degrees of freedom. */
export function fUpperTailP(f: number, df1: number, df2: number): number {
  return incompleteBeta(df2 / (df2 + df1 * f), df2 / 2, df1 / 2);
}

/** Complementary error function (Numerical Recipes, Chebyshev fit, relative error below 1.2e-7). */
function erfc(x: number): number {
  const z = Math.abs(x);
  const t = 1 / (1 + 0.5 * z);
  const coefficients = [1.00002368, 0.37409196, 0.09678418, -0.18628806, 0.27886807, -1.13520398, 1.48851587, -0.82215223, 0.17087277];
  let polynomial = 0;
  for (let i = coefficients.length - 1; i >= 0; i--) polynomial = coefficients[i]! + t * polynomial;
  const r = t * Math.exp(-z * z - 1.26551223 + t * polynomial);
  return x >= 0 ? r : 2 - r;
}

/** Two-tailed p of a z statistic. */
export function zTwoTailedP(z: number): number {
  return erfc(Math.abs(z) / Math.SQRT2);
}
