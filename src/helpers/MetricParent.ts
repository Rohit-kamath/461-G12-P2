export abstract class MetricParent {
  // Shared properties can be defined here
  protected someSharedProperty: string;
  protected metricName: string;
  protected contributor: string;

  constructor(
    someSharedProperty: string,
    metricName: string,
    contributor: string
  ) {
    this.someSharedProperty = someSharedProperty;
    this.metricName = metricName;
    this.contributor = contributor;
  }

  // Shared method to perform some common calculations
  protected commonCalculation(input: number): number {
    return input * 2;
  }

  // Method to get the name of the metric
  getMetricName(): string {
    return this.metricName;
  }

  // Method to get the contributor of the metric
  getContributor(): string {
    return this.contributor;
  }

  // Abstract method to be implemented by child classes
  abstract calculateMetric(): any;

  // Optional: Abstract method to fetch data (if needed)
  abstract fetchData(): Promise<any>;
}
