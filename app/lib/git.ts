import * as GitHubApi from "@octokit/rest";

/**
 * Load sha and commit date from repo to present on the UI
 */
export async function gitInfo(): Promise<{ version: string, date: string }> {
    const api = new GitHubApi();
    api.authenticate({
        type: "token",
        token: process.env.GITHUB_TOKEN,
    });

    const repo = {
        owner: "sdd-manifesto",
        repo: "manifesto",
    };
    const sha = process.env.HEROKU_SLUG_COMMIT;

    try {
        const tag = await (api as any).gitdata.getTag({
            tag_sha: sha,
            ...repo,
        });

        return {
            version: tag.data.tag,
            date: tag.data.tagger.date,
        };
    } catch (err) {
        console.error(err);
        // Ignore as it simply means we got no tag on the sha
    }

    try {
        const commit = await api.repos.getCommit({
            sha: process.env.HEROKU_SLUG_COMMIT,
            ...repo,
        });

        return {
            version: commit.data.sha.slice(0, 7),
            date: commit.data.commit.committer.date,
        };
    } catch (err) {
        return {
            version: "0000000",
            date: new Date().toISOString(),
        };
    }
}
