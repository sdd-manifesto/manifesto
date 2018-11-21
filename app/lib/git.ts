import * as GitHubApi from "@octokit/rest";

/**
 * Load sha and commit date from repo to present on the UI
 */
export async function gitInfo(): Promise<{ sha: string, date: string }> {
    const api = new GitHubApi();
    api.authenticate({
        type: "token",
        token: process.env.GITHUB_TOKEN,
    });

    try {
        const commit = await api.repos.getCommit({
            sha: process.env.HEROKU_SLUG_COMMIT,
            owner: "sdd-manifesto",
            repo: "manifesto",
        });

        return {
            sha: commit.data.sha,
            date: commit.data.commit.committer.date,
        };
    } catch (err) {
        return {
            sha: "0000000",
            date: new Date().toISOString(),
        };
    }
}
