import * as GitHubApi from "@octokit/rest";
import * as remoteGitTags from "remote-git-tags";
import * as semver from "semver";

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
    const sha = process.env.ATOMIST_SHA || process.env.HEROKU_SLUG_COMMIT;
    let version = sha.slice(0, 7);

    try {
        const tags: Map<string, string> = await remoteGitTags(`github.com/${repo.owner}/${repo.repo}`);
        for (const tag of tags.entries()) {
            if (tag[1] === sha) {
                const t = semver.parse(tag[0]);
                if (t.prerelease.length === 0) {
                    version = `${t.major}.${t.minor}`;
                }
            }
        }
    } catch (err) {
        // Ignore as it simply means we got no tags
    }

    try {
        const commit = await api.repos.getCommit({
            sha,
            ...repo,
        });

        return {
            version,
            date: commit.data.commit.committer.date,
        };
    } catch (err) {
        return {
            version: "0.0",
            date: new Date().toISOString(),
        };
    }
}
