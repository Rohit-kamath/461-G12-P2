import { numberOfCommits, numberOfApprovedPRs, getPullRequest } from "../src/controllers/pullRequest";
import { getRequest } from "../src/utils/api.utils";

// Mocking the getRequest function from api.utils
jest.mock("../src/utils/api.utils");

describe("Git Repository Metrics", () => {

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("numberOfCommits", () => {
        it("should return the total number of commits", async () => {
            const mockCommits = [ {}, {}, {} ]; // 3 commits
            (getRequest as jest.MockedFunction<typeof getRequest>).mockResolvedValueOnce(mockCommits);

            const result = await numberOfCommits("testOwner", "testRepo");
            expect(result).toBe(3);
        });
    });

    describe("numberOfApprovedPRs", () => {
        it("should return the number of approved pull requests", async () => {
            const mockPRs = [
                { merged_at: "some-date" },
                { merged_at: "some-date" },
                { merged_at: null }
        ];
            (getRequest as jest.MockedFunction<typeof getRequest>).mockResolvedValueOnce(mockPRs);

            const result = await numberOfApprovedPRs("testOwner", "testRepo");
            expect(result).toBe(2);
        });
    });

    describe("getPullRequest", () => {
        it("should return the metric based on approved PRs and commits", async () => {
            const mockCommits = [ {}, {}, {}, {} ]; // 4 commits
            const mockPRs = [
            { merged_at: "some-date" },
            { merged_at: "some-date" }
            ];
            (getRequest as jest.MockedFunction<typeof getRequest>).mockResolvedValueOnce(mockPRs).mockResolvedValueOnce(mockCommits);

            const result = await getPullRequest("testOwner", "testRepo");
            expect(result).toBe(0.5);
        });

        it("should cap the metric at 1", async () => {
            const mockCommits = [ {}, {}, {} ]; // 3 commits
            const mockPRs = [
                { merged_at: "some-date" },
                { merged_at: "some-date" },
                { merged_at: "some-date" },
                { merged_at: "some-date" }
            ];
            (getRequest as jest.MockedFunction<typeof getRequest>).mockResolvedValueOnce(mockPRs).mockResolvedValueOnce(mockCommits);

            const result = await getPullRequest("testOwner", "testRepo");
            expect(result).toBe(1);
        });
    });

});
