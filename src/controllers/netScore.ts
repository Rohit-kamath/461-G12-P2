import { Correctness } from './correctness';
import { getBusFactor } from './busFactor';
import { calculateRampUp } from './rampUp';
import { Responsiveness } from './responsiveness';
import { getLicenseScore } from './license';
import { calculateGoodPinningPractice } from './goodPinningPractice';
import { getPullRequest } from './pullRequest';
import createModuleLogger from '../logger';

const logger = createModuleLogger('Net Score');

export class NetScore {
    constructor(
        private owner: string,
        private repo: string,
    ) {}
    async calculate(): Promise<{
        NET_SCORE: number;
        RAMP_UP_SCORE: number;
        CORRECTNESS_SCORE: number;
        BUS_FACTOR_SCORE: number;
        RESPONSIVE_MAINTAINER_SCORE: number;
        LICENSE_SCORE: number;
        PULL_REQUEST_SCORE: number;
        GOOD_PINNING_PRACTICE_SCORE: number;
    }> {
        // const correctnessobj = new correctness(this.owner, this.repo);
        logger.info('Beginning to calculate net score');
        logger.info(`Beginning to calculate correctness score for ${this.owner}/${this.repo}`)
        const correctness = new Correctness(this.owner, this.repo);
        const CORRECTNESS_SCORE = await correctness.check(this.owner, this.repo);
        //const CORRECTNESS_SCORE = 1;
        logger.info(`Beginning to calculate bus factor score for ${this.owner}/${this.repo}`)
        const BUS_FACTOR_SCORE = await getBusFactor(this.owner, this.repo);
        logger.info(`Beginning to calculate ramp up score for ${this.owner}/${this.repo}`)
        const RAMP_UP_SCORE = await calculateRampUp(this.owner, this.repo);
        logger.info(`Beginning to calculate responsiveness score for ${this.owner}/${this.repo}`)
        const responsiveness = new Responsiveness('someSharedProperty', this.owner, this.repo);
        const RESPONSIVE_MAINTAINER_SCORE = await responsiveness.calculateMetric();
        logger.info(`Beginning to calculate license score for ${this.owner}/${this.repo}`)
        const LICENSE_SCORE = await getLicenseScore(this.owner, this.repo);
        logger.info(`Beginning to calculate good pinning practice score for ${this.owner}/${this.repo}`)
        const GOOD_PINNING_PRACTICE_SCORE = await calculateGoodPinningPractice(this.owner, this.repo);
        logger.info(`Beginning to calculate pull request score for ${this.owner}/${this.repo}`)
        const PULL_REQUEST_SCORE = await getPullRequest(this.owner, this.repo);
        const NET_SCORE = CORRECTNESS_SCORE * 0.25 + BUS_FACTOR_SCORE * 0.15 + RAMP_UP_SCORE * 0.25 + RESPONSIVE_MAINTAINER_SCORE * 0.3 + LICENSE_SCORE * 0.05;
        logger.info('Finished calculating net score');
        return {
            NET_SCORE: parseFloat(NET_SCORE.toFixed(3)),
            RAMP_UP_SCORE: parseFloat(RAMP_UP_SCORE.toFixed(3)),
            CORRECTNESS_SCORE: parseFloat(CORRECTNESS_SCORE.toFixed(3)),
            BUS_FACTOR_SCORE: parseFloat(BUS_FACTOR_SCORE.toFixed(3)),
            RESPONSIVE_MAINTAINER_SCORE: parseFloat(RESPONSIVE_MAINTAINER_SCORE.toFixed(3)),
            LICENSE_SCORE: parseFloat(LICENSE_SCORE.toFixed(3)),
            PULL_REQUEST_SCORE: parseFloat(PULL_REQUEST_SCORE.toFixed(3)),
            GOOD_PINNING_PRACTICE_SCORE: parseFloat(GOOD_PINNING_PRACTICE_SCORE.toFixed(3)),
        };
    }
}
