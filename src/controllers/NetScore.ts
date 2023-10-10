import { correctness } from "./correctness";
import { calculateBusFactor } from "./BusFactor";
import { calculateRampUp } from "./RampUp";
import { Responsiveness } from "./Responsiveness";
import { License } from "./License";

export class NET_SCORE {
    constructor(private owner: string, private repo: string) {
    };
    async calculate(): Promise<{NET_SCORE: number, RAMP_UP_SCORE: number, CORRECTNESS_SCORE: number, BUS_FACTOR_SCORE: number, RESPONSIVE_MAINTAINER_SCORE: number, LICENSE_SCORE: number}> {
        ////console.log("HERE");
        const correctnessobj = new correctness(this.owner, this.repo);
        ////console.log("correctness", correctnessobj);
        let CORRECTNESS_SCORE = 0;
        try {
            CORRECTNESS_SCORE = await correctnessobj.check();
            ////console.log("CORRECTNESS_SCORE", CORRECTNESS_SCORE);
        } catch(e) {
            ////console.log("Error", e);
        }
        let BUS_FACTOR_SCORE = 0;
        try {
            BUS_FACTOR_SCORE = await calculateBusFactor(this.owner, this.repo);
            ////console.log("BusFactor", BUS_FACTOR_SCORE);
        } catch(e) {
            ////console.log("Error", e);
        }
        if (BUS_FACTOR_SCORE > 1) {
            BUS_FACTOR_SCORE = 1;
        }
        const RAMP_UP_SCORE = await calculateRampUp(this.owner, this.repo);
        ////console.log("RAMP_UP_SCORE", RAMP_UP_SCORE);
        const responsiveness = new Responsiveness('someSharedProperty', this.owner, this.repo);
        ////console.log("Responsiveness", responsiveness);
        /* const res = await responsiveness.fetchData();
        ////console.log("RES", res); */
        const RESPONSIVE_MAINTAINER_SCORE = responsiveness.calculateMetric();
        ////console.log("RESPONSIVE_MAINTAINER_SCORE", RESPONSIVE_MAINTAINER_SCORE);
        const license = new License('someSharedProperty', this.owner, this.repo);
        const LICENSE_SCORE = license.calculateMetric();
        ////console.log("LICENSE_SCORE", LICENSE_SCORE);
        const NET_SCORE = (CORRECTNESS_SCORE * 0.25 + BUS_FACTOR_SCORE * 0.15 + RAMP_UP_SCORE * 0.25 + RESPONSIVE_MAINTAINER_SCORE * 0.3 + LICENSE_SCORE * 0.05);
        ////console.log("NET_SCORE", NET_SCORE);


        return {NET_SCORE, RAMP_UP_SCORE, CORRECTNESS_SCORE, BUS_FACTOR_SCORE, RESPONSIVE_MAINTAINER_SCORE, LICENSE_SCORE};
    }
}
