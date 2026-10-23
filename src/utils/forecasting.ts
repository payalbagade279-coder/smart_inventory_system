import { SaleRecord, ForecastPoint, ForecastMetrics } from '../types/inventory';

export interface DailySaleSeries {
  date: string;
  dayOfWeek: number; // 0 = Sun, 1 = Mon ...
  quantity: number;
}

/**
 * Builds continuous daily time series for a product, filling missing dates with 0.
 */
export function buildContinuousDailySeries(
  productId: string,
  sales: SaleRecord[],
  totalDays: number = 60,
  referenceDateStr?: string
): DailySaleSeries[] {
  const refDate = referenceDateStr ? new Date(referenceDateStr) : new Date();
  const series: DailySaleSeries[] = [];
  const salesMap: Record<string, number> = {};

  sales
    .filter((s) => s.productId === productId)
    .forEach((s) => {
      salesMap[s.date] = (salesMap[s.date] || 0) + s.quantity;
    });

  for (let i = totalDays - 1; i >= 0; i--) {
    const d = new Date(refDate);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    series.push({
      date: dateStr,
      dayOfWeek: d.getDay(),
      quantity: salesMap[dateStr] || 0,
    });
  }

  return series;
}

/**
 * Ordinary Least Squares Linear Regression: y = mx + b
 */
function fitLinearRegression(points: { x: number; y: number }[]): {
  slope: number;
  intercept: number;
  rSquared: number;
} {
  const n = points.length;
  if (n < 2) return { slope: 0, intercept: points[0]?.y || 0, rSquared: 0 };

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;
  let sumYY = 0;

  for (const p of points) {
    sumX += p.x;
    sumY += p.y;
    sumXY += p.x * p.y;
    sumXX += p.x * p.x;
    sumYY += p.y * p.y;
  }

  const denominator = n * sumXX - sumX * sumX;
  if (denominator === 0) {
    return { slope: 0, intercept: sumY / n, rSquared: 0 };
  }

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  // Calculate R-squared
  const meanY = sumY / n;
  let ssTotal = 0;
  let ssResidual = 0;
  for (const p of points) {
    const predicted = slope * p.x + intercept;
    ssResidual += Math.pow(p.y - predicted, 2);
    ssTotal += Math.pow(p.y - meanY, 2);
  }
  const rSquared = ssTotal === 0 ? 1 : Math.max(0, 1 - ssResidual / ssTotal);

  return { slope, intercept, rSquared };
}

/**
 * Computes seasonal weekday averages from a training series.
 */
function computeWeekdayAverages(series: DailySaleSeries[]): Record<number, number> {
  const totals: Record<number, { sum: number; count: number }> = {
    0: { sum: 0, count: 0 },
    1: { sum: 0, count: 0 },
    2: { sum: 0, count: 0 },
    3: { sum: 0, count: 0 },
    4: { sum: 0, count: 0 },
    5: { sum: 0, count: 0 },
    6: { sum: 0, count: 0 },
  };

  series.forEach((item) => {
    totals[item.dayOfWeek].sum += item.quantity;
    totals[item.dayOfWeek].count += 1;
  });

  const averages: Record<number, number> = {};
  for (let dow = 0; dow < 7; dow++) {
    const item = totals[dow];
    averages[dow] = item.count > 0 ? Number((item.sum / item.count).toFixed(2)) : 0;
  }

  return averages;
}

/**
 * Performs Chronological Out-of-Sample Historical Validation and creates 7-Day Forecast.
 */
export function generateForecastAndValidation(
  productId: string,
  sales: SaleRecord[],
  totalHistoryDays: number = 60,
  testDays: number = 14,
  forecastAheadDays: number = 7,
  referenceDateStr?: string
): {
  points: ForecastPoint[];
  metrics: ForecastMetrics;
  hasEnoughData: boolean;
  dataExplanation: string;
} {
  const fullSeries = buildContinuousDailySeries(productId, sales, totalHistoryDays, referenceDateStr);

  const nonZeroSales = fullSeries.filter((s) => s.quantity > 0).length;
  const hasEnoughData = fullSeries.length >= 21 && nonZeroSales >= 5;

  if (!hasEnoughData) {
    // Insufficient historical data fallback
    const totalQty = fullSeries.reduce((acc, cur) => acc + cur.quantity, 0);
    const avg = fullSeries.length > 0 ? Number((totalQty / fullSeries.length).toFixed(2)) : 1;

    const points: ForecastPoint[] = fullSeries.slice(-14).map((s) => ({
      date: s.date,
      label: s.date.slice(5),
      actual: s.quantity,
      seasonalNaive: avg,
      linearTrend: avg,
      isFuture: false,
    }));

    const lastDate = new Date(fullSeries[fullSeries.length - 1]?.date || new Date());
    for (let i = 1; i <= forecastAheadDays; i++) {
      const fDate = new Date(lastDate);
      fDate.setDate(fDate.getDate() + i);
      const dateStr = fDate.toISOString().split('T')[0];
      points.push({
        date: dateStr,
        label: dateStr.slice(5),
        seasonalNaive: avg,
        linearTrend: avg,
        isFuture: true,
      });
    }

    return {
      points,
      metrics: {
        maeNaive: 0,
        maeTrend: 0,
        wapeNaive: 0,
        wapeTrend: 0,
        testPeriodDays: 0,
        rSquared: 0,
      },
      hasEnoughData: false,
      dataExplanation:
        'Insufficient historical data (< 21 days or < 5 sales events). Estimates show simple historical average without seasonality or complex regression.',
    };
  }

  // 1. Train / Test Split for Chronological Validation
  const trainCutoff = fullSeries.length - testDays;
  const trainSeries = fullSeries.slice(0, trainCutoff);
  const testSeries = fullSeries.slice(trainCutoff);

  // Train models on training set strictly
  const trainWeekdayAverages = computeWeekdayAverages(trainSeries);
  const regressionPoints = trainSeries.map((s, idx) => ({ x: idx, y: s.quantity }));
  const { slope, intercept, rSquared } = fitLinearRegression(regressionPoints);

  // Evaluate on test set
  let absErrorNaiveSum = 0;
  let absErrorTrendSum = 0;
  let actualSum = 0;

  testSeries.forEach((testItem, i) => {
    const actual = testItem.quantity;
    actualSum += actual;

    // Naive seasonal forecast for test item
    const predNaive = Math.max(0, trainWeekdayAverages[testItem.dayOfWeek] || 0);
    absErrorNaiveSum += Math.abs(actual - predNaive);

    // Trend forecast for test item
    const xVal = trainCutoff + i;
    const predTrend = Math.max(0, Number((slope * xVal + intercept).toFixed(2)));
    absErrorTrendSum += Math.abs(actual - predTrend);
  });

  const testCount = Math.max(1, testSeries.length);
  const safeActualSum = actualSum > 0 ? actualSum : 1;

  const maeNaive = Number((absErrorNaiveSum / testCount).toFixed(2));
  const maeTrend = Number((absErrorTrendSum / testCount).toFixed(2));
  const wapeNaive = Number(((absErrorNaiveSum / safeActualSum) * 100).toFixed(1));
  const wapeTrend = Number(((absErrorTrendSum / safeActualSum) * 100).toFixed(1));

  // 2. Full Train for Future Forecasting (use all historical points up to now)
  const fullWeekdayAverages = computeWeekdayAverages(fullSeries);
  const fullRegressionPoints = fullSeries.map((s, idx) => ({ x: idx, y: s.quantity }));
  const fullModel = fitLinearRegression(fullRegressionPoints);

  // Build combined chart points (showing last 21 days of history + 7 days future)
  const displayHistoryDays = 21;
  const recentHistory = fullSeries.slice(-displayHistoryDays);

  const points: ForecastPoint[] = recentHistory.map((s, idx) => {
    const historicalIdx = fullSeries.length - displayHistoryDays + idx;
    const inTestPeriod = historicalIdx >= trainCutoff;

    let testPredNaive: number | undefined = undefined;
    let testPredTrend: number | undefined = undefined;

    if (inTestPeriod) {
      // Historical test prediction from backtest
      testPredNaive = Math.max(0, trainWeekdayAverages[s.dayOfWeek]);
      testPredTrend = Math.max(0, Number((slope * historicalIdx + intercept).toFixed(2)));
    }

    return {
      date: s.date,
      label: s.date.slice(5),
      actual: s.quantity,
      seasonalNaive: testPredNaive,
      linearTrend: testPredTrend,
      isFuture: false,
    };
  });

  // Add 7 Future Forecast Days
  const lastDate = new Date(fullSeries[fullSeries.length - 1].date);
  for (let i = 1; i <= forecastAheadDays; i++) {
    const fDate = new Date(lastDate);
    fDate.setDate(fDate.getDate() + i);
    const dateStr = fDate.toISOString().split('T')[0];
    const dow = fDate.getDay();

    const futureNaive = Math.max(0, fullWeekdayAverages[dow]);
    const futureX = fullSeries.length + i - 1;
    const futureTrend = Math.max(0, Number((fullModel.slope * futureX + fullModel.intercept).toFixed(2)));

    points.push({
      date: dateStr,
      label: `${dateStr.slice(5)} (F)`,
      actual: undefined,
      seasonalNaive: futureNaive,
      linearTrend: futureTrend,
      isFuture: true,
    });
  }

  return {
    points,
    metrics: {
      maeNaive,
      maeTrend,
      wapeNaive,
      wapeTrend,
      testPeriodDays: testDays,
      rSquared: Number(rSquared.toFixed(3)),
    },
    hasEnoughData: true,
    dataExplanation: `Trained on ${trainSeries.length} days, validated on subsequent ${testDays} days. WAPE compares prediction error against real customer purchase volume.`,
  };
}
