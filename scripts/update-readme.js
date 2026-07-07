const fs = require("fs");
const path = require("path");

const README_PATH = path.join(__dirname, "..", "README.md");

const query = `
query {
  viewer {
    repositories(ownerAffiliations: OWNER, privacy: ALL) {
      totalCount
    }
    followers {
      totalCount
    }
    following {
      totalCount
    }
    contributionsCollection {
      totalCommitContributions
    }
  }
}
`;

async function fetchStats() {
  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GH_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });

  const result = await response.json();

  if (result.errors) {
    throw new Error(JSON.stringify(result.errors, null, 2));
  }

  const viewer = result.data.viewer;

  return {
    repos: viewer.repositories.totalCount,
    followers: viewer.followers.totalCount,
    following: viewer.following.totalCount,
    commits: viewer.contributionsCollection.totalCommitContributions,
  };
}

function replacePlaceholder(content, name, value) {
  const regex = new RegExp(`<!--${name}-->\\d+<!--/${name}-->`, "g");
  return content.replace(regex, `<!--${name}-->${value}<!--/${name}-->`);
}

async function main() {
  const stats = await fetchStats();
  let readme = fs.readFileSync(README_PATH, "utf8");

  readme = replacePlaceholder(readme, "REPO_COUNT", stats.repos);
  readme = replacePlaceholder(readme, "FOLLOWERS_COUNT", stats.followers);
  readme = replacePlaceholder(readme, "FOLLOWING_COUNT", stats.following);
  readme = replacePlaceholder(readme, "COMMITS_COUNT", stats.commits);

  fs.writeFileSync(README_PATH, readme, "utf8");

  console.log("Updated README stats:", stats);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
