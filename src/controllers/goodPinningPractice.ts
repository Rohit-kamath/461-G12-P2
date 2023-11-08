import { getRequest } from '../utils/api.utils';
import createModuleLogger from '../logger';

const logger = createModuleLogger('Good Pinning Practice');

interface Dependency {
    name: string;
    version: string;
}

export async function getDependencies(owner: string, repo: string): Promise<Dependency[] | null> {
    try {
        const response = await getRequest(`/repos/${owner}/${repo}/contents/package.json`);
        const packageJson = Buffer.from(response.content, 'base64').toString('ascii');
        const dependencies = JSON.parse(packageJson).dependencies;
        const dependencyArray: Dependency[] = [];
        for (const dependency in dependencies) {
            const dependencyObject: Dependency = {
                name: dependency,
                version: dependencies[dependency],
            };
            dependencyArray.push(dependencyObject);
        }
        return dependencyArray;
    } catch (error: any) {
        logger.info('Error in getDependencies: with repo: ' + repo + ' and owner: ' + owner, error);
        process.exit(1);
    }
}

export async function calculateGoodPinningPractice(owner: string, repo: string): Promise<number> {
    const dependencies = await getDependencies(owner, repo);
    const totalDependencies = dependencies ? dependencies.length : 0;

    let pinnedDependencies = 0;
    if (dependencies) {
        dependencies.forEach((dependency) => {
            if (dependency.version.includes('^') || dependency.version.includes('~')) {
                pinnedDependencies += 1;
            }
        });
    }

    return totalDependencies === 0 ? 1 : pinnedDependencies / totalDependencies;
}
