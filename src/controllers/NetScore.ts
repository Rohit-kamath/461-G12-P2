import { correctness } from "./correctness";
import { calculateBusFactor} from "./BusFactor";
import { calculateRampUp } from "./RampUp";
import { Responsiveness } from "./Responsiveness";
import { getLicenseScore } from "./License";

export class NET_SCORE {
    constructor(private owner: string, private repo: string) {};
    async calculate(): Promise<{NET_SCORE: number, RAMP_UP_SCORE: number, CORRECTNESS_SCORE: number, BUS_FACTOR_SCORE: number, RESPONSIVE_MAINTAINER_SCORE: number, LICENSE_SCORE: number}> {
        const correctnessobj = new correctness(this.owner, this.repo);
        let CORRECTNESS_SCORE = 0;
        const BUS_FACTOR_SCORE = await calculateBusFactor(this.owner, this.repo);
        const RAMP_UP_SCORE = await calculateRampUp(this.owner, this.repo);
        const responsiveness = new Responsiveness('someSharedProperty', this.owner, this.repo);
        const RESPONSIVE_MAINTAINER_SCORE = await responsiveness.calculateMetric();
        const LICENSE_SCORE = await getLicenseScore(this.owner, this.repo);
        const NET_SCORE = (CORRECTNESS_SCORE * 0.25 + BUS_FACTOR_SCORE * 0.15 + RAMP_UP_SCORE * 0.25 + RESPONSIVE_MAINTAINER_SCORE * 0.3 + LICENSE_SCORE * 0.05);
        return {NET_SCORE, RAMP_UP_SCORE, CORRECTNESS_SCORE, BUS_FACTOR_SCORE, RESPONSIVE_MAINTAINER_SCORE, LICENSE_SCORE};
    }
}
