"use strict";
exports.__esModule = true;
exports.MetricParent = void 0;
var MetricParent = /** @class */ (function () {
    function MetricParent(someSharedProperty, metricName, contributor) {
        this.someSharedProperty = someSharedProperty;
        this.metricName = metricName;
        this.contributor = contributor;
    }
    // Shared method to perform some common calculations
    MetricParent.prototype.commonCalculation = function (input) {
        return input * 2;
    };
    // Method to get the name of the metric
    MetricParent.prototype.getMetricName = function () {
        return this.metricName;
    };
    // Method to get the contributor of the metric
    MetricParent.prototype.getContributor = function () {
        return this.contributor;
    };
    return MetricParent;
}());
exports.MetricParent = MetricParent;
